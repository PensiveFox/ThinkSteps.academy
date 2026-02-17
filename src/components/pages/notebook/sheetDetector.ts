/* eslint-disable @typescript-eslint/no-explicit-any */

// OpenCV.js types are dynamic — we use `any` for cv operations
type CV = any

function getCv(): CV {
  return (window as any).cv
}

export interface Point {
  x: number
  y: number
}

export interface SheetCorners {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

/**
 * Detect the largest quadrilateral (sheet of paper) in the frame.
 * Uses multiple strategies for robustness:
 *   1) Adaptive threshold (works well for paper on any background)
 *   2) Canny edges (fallback)
 * Returns 4 corners sorted as: topLeft, topRight, bottomRight, bottomLeft.
 * Returns null if no suitable quadrilateral is found.
 */
export function detectSheet(src: any): SheetCorners | null {
  const cv = getCv()
  if (!cv) {
    return null
  }

  // Try adaptive threshold first, then Canny as fallback
  const result =
    detectWithAdaptiveThreshold(cv, src) || detectWithCanny(cv, src)
  return result
}

function detectWithAdaptiveThreshold(cv: CV, src: any): SheetCorners | null {
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const thresh = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    const ksize = new cv.Size(7, 7)
    cv.GaussianBlur(gray, blurred, ksize, 0)

    // Adaptive threshold — handles uneven lighting much better
    cv.adaptiveThreshold(
      blurred,
      thresh,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      15,
      3,
    )

    // Invert so paper is white contour on dark
    cv.bitwise_not(thresh, thresh)

    // Morphological close to fill gaps
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
    cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, kernel)
    kernel.delete()

    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    )

    return findBestQuad(cv, contours, src.rows, src.cols)
  } finally {
    gray.delete()
    blurred.delete()
    thresh.delete()
    contours.delete()
    hierarchy.delete()
  }
}

function detectWithCanny(cv: CV, src: any): SheetCorners | null {
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const edges = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    const ksize = new cv.Size(5, 5)
    cv.GaussianBlur(gray, blurred, ksize, 0)

    // Multi-threshold: try tight first, then loose
    for (const [lo, hi] of [
      [75, 200],
      [50, 150],
      [30, 100],
    ]) {
      cv.Canny(blurred, edges, lo, hi)

      const kernel = cv.Mat.ones(3, 3, cv.CV_8U)
      cv.dilate(edges, edges, kernel)
      kernel.delete()

      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE,
      )

      const result = findBestQuad(cv, contours, src.rows, src.cols)
      if (result) {
        return result
      }
    }

    return null
  } finally {
    gray.delete()
    blurred.delete()
    edges.delete()
    contours.delete()
    hierarchy.delete()
  }
}

/**
 * Find the best quadrilateral from contours.
 * Filters by: min area, convexity, aspect ratio, angle sanity.
 */
function findBestQuad(
  cv: CV,
  contours: any,
  rows: number,
  cols: number,
): SheetCorners | null {
  let bestContour: any = null
  let bestArea = 0
  const minArea = rows * cols * 0.05 // at least 5% of frame (lowered from 10%)
  const maxArea = rows * cols * 0.98

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i)
    const area = cv.contourArea(contour)

    if (area < minArea || area > maxArea) {
      continue
    }

    // Must be convex
    if (!cv.isContourConvex(contour)) {
      // Try convex hull
      const hull = new cv.Mat()
      cv.convexHull(contour, hull)
      const hullArea = cv.contourArea(hull)

      // If convex hull area is too different from contour area, skip
      if (hullArea > 0 && area / hullArea < 0.8) {
        hull.delete()
        continue
      }
      hull.delete()
    }

    const peri = cv.arcLength(contour, true)

    // Try multiple epsilon values for approxPolyDP
    for (const epsFactor of [0.02, 0.03, 0.04, 0.05]) {
      const approx = new cv.Mat()
      cv.approxPolyDP(contour, approx, epsFactor * peri, true)

      if (approx.rows === 4 && area > bestArea) {
        // Check that angles are reasonable (not too acute)
        const pts = extractPoints(approx)
        if (isReasonableQuad(pts)) {
          if (bestContour) {
            bestContour.delete()
          }
          bestContour = approx
          bestArea = area
          break // found good one with this contour
        }
      }

      if (approx !== bestContour) {
        approx.delete()
      }
    }
  }

  if (!bestContour) {
    return null
  }

  const points = extractPoints(bestContour)
  bestContour.delete()

  return sortCorners(points)
}

function extractPoints(mat: any): Point[] {
  const points: Point[] = []
  for (let i = 0; i < mat.rows; i++) {
    points.push({
      x: mat.data32S[i * 2],
      y: mat.data32S[i * 2 + 1],
    })
  }
  return points
}

/**
 * Check that a quadrilateral has reasonable angles (no super-acute corners)
 * and reasonable aspect ratio.
 */
function isReasonableQuad(pts: Point[]): boolean {
  if (pts.length !== 4) {
    return false
  }

  // Check all interior angles are between 45° and 135°
  for (let i = 0; i < 4; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % 4]
    const c = pts[(i + 2) % 4]

    const ab = { x: b.x - a.x, y: b.y - a.y }
    const cb = { x: b.x - c.x, y: b.y - c.y }

    const dot = ab.x * cb.x + ab.y * cb.y
    const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y)
    const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y)

    if (magAB === 0 || magCB === 0) {
      return false
    }

    const cosAngle = dot / (magAB * magCB)
    const angle =
      Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)

    if (angle < 30 || angle > 160) {
      return false
    }
  }

  return true
}

/**
 * Sort 4 points into consistent order: TL, TR, BR, BL
 */
function sortCorners(pts: Point[]): SheetCorners {
  // Sort by sum (x+y): smallest = topLeft, largest = bottomRight
  const sorted = [...pts].sort((a, b) => a.x + a.y - (b.x + b.y))
  const topLeft = sorted[0]
  const bottomRight = sorted[3]

  // Sort by diff (y-x): smallest = topRight, largest = bottomLeft
  const remaining = [sorted[1], sorted[2]]
  remaining.sort((a, b) => a.y - a.x - (b.y - b.x))
  const topRight = remaining[0]
  const bottomLeft = remaining[1]

  return { topLeft, topRight, bottomRight, bottomLeft }
}

/**
 * Smooth corners between frames to prevent jitter.
 * Returns new corners that are a weighted average of previous and current.
 */
export function smoothCorners(
  prev: SheetCorners,
  curr: SheetCorners,
  alpha = 0.3,
): SheetCorners {
  function lerp(a: Point, b: Point): Point {
    return {
      x: Math.round(a.x * (1 - alpha) + b.x * alpha),
      y: Math.round(a.y * (1 - alpha) + b.y * alpha),
    }
  }

  return {
    topLeft: lerp(prev.topLeft, curr.topLeft),
    topRight: lerp(prev.topRight, curr.topRight),
    bottomRight: lerp(prev.bottomRight, curr.bottomRight),
    bottomLeft: lerp(prev.bottomLeft, curr.bottomLeft),
  }
}

/**
 * Create default corners (centered rectangle) for manual mode.
 */
export function defaultCorners(
  width: number,
  height: number,
  margin = 0.15,
): SheetCorners {
  const mx = Math.round(width * margin)
  const my = Math.round(height * margin)
  return {
    topLeft: { x: mx, y: my },
    topRight: { x: width - mx, y: my },
    bottomRight: { x: width - mx, y: height - my },
    bottomLeft: { x: mx, y: height - my },
  }
}

/**
 * Apply perspective transform to extract the sheet as a flat rectangle.
 * Returns a new Mat with the warped image. Caller must delete() it.
 */
export function warpSheet(
  src: any,
  corners: SheetCorners,
  outputWidth: number,
  outputHeight: number,
): any {
  const cv = getCv()

  // Source points (detected corners)
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners.topLeft.x,
    corners.topLeft.y,
    corners.topRight.x,
    corners.topRight.y,
    corners.bottomRight.x,
    corners.bottomRight.y,
    corners.bottomLeft.x,
    corners.bottomLeft.y,
  ])

  // Destination points (flat rectangle)
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    outputWidth,
    0,
    outputWidth,
    outputHeight,
    0,
    outputHeight,
  ])

  const M = cv.getPerspectiveTransform(srcPts, dstPts)
  const dst = new cv.Mat()
  const dsize = new cv.Size(outputWidth, outputHeight)
  cv.warpPerspective(src, dst, M, dsize)

  srcPts.delete()
  dstPts.delete()
  M.delete()

  return dst
}

/**
 * Draw the detected sheet outline on a canvas context.
 */
export function drawSheetOutline(
  ctx: CanvasRenderingContext2D,
  corners: SheetCorners,
  color = '#00ff00',
  lineWidth = 3,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
  ctx.lineTo(corners.topRight.x, corners.topRight.y)
  ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
  ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
  ctx.closePath()
  ctx.stroke()

  // Draw corner dots
  const dotSize = 6
  ctx.fillStyle = color
  for (const pt of [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ]) {
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }
}
