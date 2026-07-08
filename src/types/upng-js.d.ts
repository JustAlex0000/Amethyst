declare module "upng-js" {
  export function encode(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[]
  ): ArrayBuffer;
  export function decode(buffer: ArrayBuffer): { width: number; height: number; depth: number };
  export function toRGBA8(img: ReturnType<typeof decode>): ArrayBuffer[];
}
