type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrCodeInstance {
  addData(data: string, mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'): void
  make(): void
  getModuleCount(): number
  isDark(row: number, col: number): boolean
  createImgTag(cellSize?: number, margin?: number, alt?: string): string
  createSvgTag(cellSize?: number, margin?: number, alt?: string): string
  createDataURL(cellSize?: number, margin?: number): string
}

export default function qrcode(typeNumber?: number, errorCorrectionLevel?: ErrorCorrectionLevel): QrCodeInstance
export const stringToBytes: (value: string) => number[]
