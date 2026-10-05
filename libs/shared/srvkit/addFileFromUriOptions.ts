export interface SaveImageFromUriOptions {
  cache?: boolean;
  rename?: string;
  header?: { [key: string]: string };
  /** 받은 바이트가 늘어날 때마다 호출된다. total 은 content-length 를 모르면 0 */
  onProgress?: (loaded: number, total: number) => void;
  /** 다운로드를 중간에 끊기 위한 신호 */
  signal?: AbortSignal;
  /** 무응답 한도(ms) */
  stallTimeout?: number;
  /** 리다이렉트 처리. 호출자가 고른 주소만 받아야 할 때 `"error"`로 막는다 */
  redirect?: RequestRedirect;
}

export interface AddFileFromUriOptions extends SaveImageFromUriOptions {
  fileId?: string;
  /** 이미 받아둔 파일이 있어도 다시 받는다 */
  force?: boolean;
  /** 실패를 삼키지 않고 그대로 던진다. 기본값은 기존 동작인 null 반환 */
  throwOnError?: boolean;
  /**
   * 스토리지로 옮긴 뒤 임시 다운로드 파일을 지운다.
   * 큰 파일은 임시 경로와 스토리지에 두 번 남아 디스크를 두 배로 먹는다.
   */
  cleanupLocalFile?: boolean;
}
