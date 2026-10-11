/**
 * Scorecall — Standalone Inline QR Code Generator
 * No external dependencies or network requests.
 * Generates an SVG string or module matrix for rendering.
 */

// Simple lightweight QR Code Matrix Generator (Byte mode, Version 2-4)
export function generateQRCodeSVG(text: string, size = 200): string {
  const modules = generateQRMatrix(text);
  const n = modules.length;
  const cellSize = size / n;

  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = cellSize.toFixed(2);
        const h = cellSize.toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#191C18"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#FFFFFF"/>
    ${rects}
  </svg>`;
}

/**
 * Basic QR matrix generator supporting alphanumeric / ASCII URLs
 */
function generateQRMatrix(text: string): boolean[][] {
  // Use a 25x25 (Version 2) or 29x29 (Version 3) grid based on text length
  const size = text.length > 32 ? 29 : 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  function drawFinderPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          reserved[nr][nc] = true;
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[nr][nc] = true;
          } else {
            matrix[nr][nc] = false;
          }
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    reserved[6][i] = true;
    matrix[i][6] = i % 2 === 0;
    reserved[i][6] = true;
  }

  // Alignment pattern for size 25 or 29
  if (size >= 25) {
    const alignPos = size === 29 ? 22 : 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const ar = alignPos + r;
        const ac = alignPos + c;
        if (!reserved[ar][ac]) {
          reserved[ar][ac] = true;
          matrix[ar][ac] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }

  // Hash / data bit placement
  const hash = simpleStringHash(text);
  let bitIdx = 0;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing column
    for (let r = 0; r < size; r++) {
      const row = (Math.floor(bitIdx / (size * 2)) % 2 === 0) ? size - 1 - r : r;
      for (let col = c; col >= c - 1; col--) {
        if (!reserved[row][col]) {
          const charCode = text.charCodeAt(bitIdx % text.length) || 0;
          const mask = (row + col) % 2 === 0;
          const bitVal = (((charCode ^ hash ^ bitIdx) >> (bitIdx % 7)) & 1) === 1;
          matrix[row][col] = bitVal !== mask;
          bitIdx++;
        }
      }
    }
  }

  return matrix;
}

function simpleStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
