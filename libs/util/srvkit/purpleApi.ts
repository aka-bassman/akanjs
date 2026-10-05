import { dayjs } from "akanjs/base";
import { adapt } from "akanjs/service";
import { Err } from "../lib/dict";
import type { ModulesOptions } from "../lib/option";

export interface PurpleApiOptions {
  phone: string;
  apiKey: string;
  apiSecret: string;
}
export class PurpleApi extends adapt("purpleApi", ({ env }) => ({
  options: env((options: ModulesOptions) => options.message),
})) {
  private static solapiLoad: Promise<{
    SolapiMessageService: new (
      apiKey: string,
      apiSecret: string,
    ) => {
      send(message: { from: string; to: string; text: string }, options: { scheduledDate: string }): Promise<unknown>;
    };
  }> | null = null;

  private static loadSolapi() {
    PurpleApi.solapiLoad ??= import("solapi") as NonNullable<typeof PurpleApi.solapiLoad>;
    return PurpleApi.solapiLoad;
  }

  #message: InstanceType<Awaited<ReturnType<typeof PurpleApi.loadSolapi>>["SolapiMessageService"]> | null = null;

  get configured() {
    return !!this.options;
  }
  #requireOptions(): PurpleApiOptions {
    if (!this.options) throw new Err("util.error.adaptorNotConfigured", { adaptor: "PurpleApi", option: "message" });
    return this.options;
  }
  async #getMessage() {
    const { apiKey, apiSecret } = this.#requireOptions();
    this.#message ??= new (await PurpleApi.loadSolapi()).SolapiMessageService(apiKey, apiSecret);
    return this.#message;
  }
  async send(to: string, text: string, at = new Date()) {
    const { phone } = this.#requireOptions();
    const message = await this.#getMessage();
    await message.send(
      { from: phone, to: to.replace(/-/g, ""), text },
      { scheduledDate: dayjs(at).format("YYYY-MM-DD HH:mm:ss") },
    );
    this.logger.info(`send: ${to} ${text} ${at}`);
    return true;
  }
  async sendPhoneCode(to: string, phoneCode: string, hash: string) {
    return await this.send(to, `[휴대폰 인증]: 인증번호 ${phoneCode} 를 입력하세요.\n${hash}`);
  }
}
