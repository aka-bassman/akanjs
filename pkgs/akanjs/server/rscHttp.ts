export const RSC_CONTENT_TYPE = "text/x-component; charset=utf-8";

export function isRscPayloadResponse(res: Response): boolean {
  if (!res.body) return false;
  if (res.ok) return true;
  return res.status === 404 && (res.headers.get("Content-Type") ?? "").toLowerCase().startsWith("text/x-component");
}
