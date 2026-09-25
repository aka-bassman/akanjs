import type { BaseEnv, Dayjs, SshOptions } from "akanjs/base";
import type { Redis } from "ioredis";
import { adapt } from "../adapt";

export interface CacheSetOptions {
  expireAt?: Dayjs;
}

export interface CacheAdaptor {
  set(topic: string, key: string, value: string | number | Buffer, option?: CacheSetOptions): Promise<void>;
  get<T extends string | number | Buffer>(topic: string, key: string): Promise<T | undefined>;
  delete(topic: string, key: string): Promise<void>;
  getClient?(): Redis;
  hset(
    topic: string,
    key: string,
    subKey: string,
    value: string | number | Buffer,
    option?: CacheSetOptions,
  ): Promise<void>;
  hget<T extends string | number | Buffer>(topic: string, key: string, subKey: string): Promise<T | undefined>;
  hdelete(topic: string, key: string, subKey: string): Promise<void>;
  hkeys(topic: string, key: string): Promise<string[]>;
  hentries<T extends string | number | Buffer>(topic: string, key: string): Promise<[string, T][]>;
  hclear(topic: string, key: string): Promise<void>;
}

interface RedisEnv extends BaseEnv {
  redis?: { username?: string; password?: string; sshOptions?: SshOptions };
}

export class RedisCache
  extends adapt("redisCache", ({ env }) => ({
    redis: env(
      async ({
        appName,
        environment,
        serveDomain,
        operationMode,
        repoName,
        redis = {
          sshOptions: {
            host: `${appName}-${environment}.${serveDomain}`,
            port: 32767,
            username: process.env.TUNNEL_USERNAME ?? "root",
            password: process.env.TUNNEL_PASSWORD ?? repoName,
            dstPort: 6379,
          },
        },
      }: RedisEnv) => {
        const createRedis = async (url: string) => {
          const { Redis } = await import("ioredis");
          // Credentials the app named in `option.ts` win over anything embedded in the URL, and are simply
          // absent when it named none — an unauthenticated Redis is the local and in-cluster shape. They used
          // to be declared on the env and read by nothing, so a password set here silently did not apply.
          const client = new Redis(url, {
            lazyConnect: true,
            ...(redis.username ? { username: redis.username } : {}),
            ...(redis.password ? { password: redis.password } : {}),
          });
          await client.connect();
          return client;
        };
        if (process.env.REDIS_URI) return await createRedis(process.env.REDIS_URI);
        else if (environment === "local") return await createRedis("redis://localhost:6379");
        if (operationMode === "cloud")
          return await createRedis(`redis://redis-svc.${appName}-${environment}.svc.cluster.local`);
        else if (operationMode === "local")
          return await createRedis(`redis://${process.env.REDIS_HOST ?? "localhost"}`);
        else return await createRedis(`redis://localhost:6379`);
      },
    ),
  }))
  implements CacheAdaptor
{
  async set(topic: string, key: string, value: string | number | Buffer, option: CacheSetOptions = {}): Promise<void> {
    const expireTime = option.expireAt?.toDate().getTime();
    if (expireTime) await this.redis.set(`${topic}:${key}`, value, "PXAT", expireTime);
    else await this.redis.set(`${topic}:${key}`, value);
  }
  async get<T extends string | number | Buffer>(topic: string, key: string): Promise<T | undefined> {
    const value = await this.redis.get(`${topic}:${key}`);
    return value as T | undefined;
  }
  async delete(topic: string, key: string) {
    await this.redis.del(`${topic}:${key}`);
  }
  //* A hash field's expiry is a score in a sorted set beside the hash: `PEXPIREAT` on the hash would expire every
  //* entry with the last one written, and per-field `HPEXPIREAT` needs Redis 7.4. Expired fields are dropped by
  //* the script below on every write and every listing, and read as missing until then.
  static readonly #purgeScript = `
local expired = redis.call("ZRANGEBYSCORE", KEYS[2], "-inf", ARGV[1], "LIMIT", 0, 500)
if #expired > 0 then
  redis.call("HDEL", KEYS[1], unpack(expired))
  redis.call("ZREM", KEYS[2], unpack(expired))
end
return #expired`;
  static #ttlKeyOf(redisKey: string) {
    return `${redisKey}:__ttl`;
  }
  async #purgeExpired(redisKey: string) {
    const ttlKey = RedisCache.#ttlKeyOf(redisKey);
    while (Number(await this.redis.eval(RedisCache.#purgeScript, 2, redisKey, ttlKey, Date.now())) >= 500);
  }
  async hset(
    topic: string,
    key: string,
    subKey: string,
    value: string | number | Buffer,
    option?: CacheSetOptions,
  ): Promise<void> {
    const expireTime = option?.expireAt?.toDate().getTime();
    const redisKey = `${topic}:${key}`;
    const ttlKey = RedisCache.#ttlKeyOf(redisKey);
    const write = this.redis.multi().hset(redisKey, subKey, value);
    if (expireTime) write.zadd(ttlKey, expireTime, subKey);
    else write.zrem(ttlKey, subKey);
    await write.exec();
    await this.#purgeExpired(redisKey);
  }
  async hget<T extends string | number | Buffer>(topic: string, key: string, subKey: string): Promise<T | undefined> {
    const redisKey = `${topic}:${key}`;
    const replies = await this.redis
      .multi()
      .hget(redisKey, subKey)
      .zscore(RedisCache.#ttlKeyOf(redisKey), subKey)
      .exec();
    const value = replies?.[0]?.[1] as string | null | undefined;
    const expireAt = replies?.[1]?.[1] as string | null | undefined;
    if (value === null || value === undefined) return undefined;
    if (expireAt !== null && expireAt !== undefined && Number(expireAt) <= Date.now()) return undefined;
    return value as T;
  }
  async hdelete(topic: string, key: string, subKey: string): Promise<void> {
    const redisKey = `${topic}:${key}`;
    await this.redis.multi().hdel(redisKey, subKey).zrem(RedisCache.#ttlKeyOf(redisKey), subKey).exec();
  }
  async hkeys(topic: string, key: string): Promise<string[]> {
    const redisKey = `${topic}:${key}`;
    await this.#purgeExpired(redisKey);
    return await this.redis.hkeys(redisKey);
  }
  async hentries<T extends string | number | Buffer>(topic: string, key: string): Promise<[string, T][]> {
    const redisKey = `${topic}:${key}`;
    await this.#purgeExpired(redisKey);
    const values = await this.redis.hgetall(redisKey);
    return Object.entries(values) as [string, T][];
  }
  async hclear(topic: string, key: string): Promise<void> {
    const redisKey = `${topic}:${key}`;
    await this.redis.del(redisKey, RedisCache.#ttlKeyOf(redisKey));
  }
  getClient(): Redis {
    return this.redis;
  }
  override async onDestroy() {
    this.redis.disconnect();
  }
}
