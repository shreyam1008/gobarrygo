package main

import (
	"image"
	"image/color"
	"image/png"
	"math"
	"os"
)

const size = 1024

func main() {
	canvas := image.NewNRGBA(image.Rect(0, 0, size, size))
	fillBackground(canvas)
	drawHalo(canvas, 250, 210, 255, color.NRGBA{R: 58, G: 199, B: 180, A: 44})
	drawHalo(canvas, 780, 180, 280, color.NRGBA{R: 244, G: 185, B: 66, A: 48})
	drawCircle(canvas, 512, 512, 320, color.NRGBA{R: 12, G: 27, B: 39, A: 255})
	drawCircle(canvas, 512, 512, 284, color.NRGBA{R: 22, G: 43, B: 60, A: 255})
	drawRing(canvas, 512, 512, 300, 22, color.NRGBA{R: 244, G: 185, B: 66, A: 255})
	drawRing(canvas, 512, 512, 236, 14, color.NRGBA{R: 58, G: 199, B: 180, A: 220})
	drawArrow(canvas)

	file, err := os.Create("build/appicon.png")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	if err := png.Encode(file, canvas); err != nil {
		panic(err)
	}
}

func fillBackground(img *image.NRGBA) {
	top := color.NRGBA{R: 7, G: 16, B: 25, A: 255}
	bottom := color.NRGBA{R: 12, G: 34, B: 43, A: 255}
	for y := 0; y < size; y++ {
		t := float64(y) / float64(size-1)
		row := blend(top, bottom, t)
		for x := 0; x < size; x++ {
			img.SetNRGBA(x, y, row)
		}
	}
}

func drawHalo(img *image.NRGBA, cx, cy, radius int, c color.NRGBA) {
	for y := max(0, cy-radius); y < min(size, cy+radius); y++ {
		for x := max(0, cx-radius); x < min(size, cx+radius); x++ {
			dx := float64(x - cx)
			dy := float64(y - cy)
			distance := math.Sqrt(dx*dx + dy*dy)
			if distance > float64(radius) {
				continue
			}
			falloff := 1 - (distance / float64(radius))
			alpha := uint8(float64(c.A) * falloff * falloff)
			if alpha == 0 {
				continue
			}
			paint(img, x, y, color.NRGBA{R: c.R, G: c.G, B: c.B, A: alpha})
		}
	}
}

func drawCircle(img *image.NRGBA, cx, cy, radius int, c color.NRGBA) {
	for y := max(0, cy-radius); y < min(size, cy+radius); y++ {
		for x := max(0, cx-radius); x < min(size, cx+radius); x++ {
			dx := x - cx
			dy := y - cy
			if dx*dx+dy*dy <= radius*radius {
				img.SetNRGBA(x, y, c)
			}
		}
	}
}

func drawRing(img *image.NRGBA, cx, cy, radius, thickness int, c color.NRGBA) {
	inner := radius - thickness
	innerSquared := inner * inner
	outerSquared := radius * radius
	for y := max(0, cy-radius); y < min(size, cy+radius); y++ {
		for x := max(0, cx-radius); x < min(size, cx+radius); x++ {
			dx := x - cx
			dy := y - cy
			d := dx*dx + dy*dy
			if d >= innerSquared && d <= outerSquared {
				img.SetNRGBA(x, y, c)
			}
		}
	}
}

func drawArrow(img *image.NRGBA) {
	white := color.NRGBA{R: 246, G: 248, B: 251, A: 255}
	accent := color.NRGBA{R: 58, G: 199, B: 180, A: 255}
	fillRect(img, 466, 266, 92, 268, white)
	fillTriangle(img, point{512, 708}, point{346, 510}, point{430, 470}, white)
	fillTriangle(img, point{512, 708}, point{678, 510}, point{594, 470}, white)
	fillRoundedRect(img, 296, 734, 432, 82, 24, accent)
	fillRoundedRect(img, 334, 760, 356, 32, 16, color.NRGBA{R: 244, G: 185, B: 66, A: 255})
}

func fillRect(img *image.NRGBA, x, y, width, height int, c color.NRGBA) {
	for py := y; py < y+height; py++ {
		for px := x; px < x+width; px++ {
			img.SetNRGBA(px, py, c)
		}
	}
}

func fillRoundedRect(img *image.NRGBA, x, y, width, height, radius int, c color.NRGBA) {
	for py := y; py < y+height; py++ {
		for px := x; px < x+width; px++ {
			if roundedRectContains(px, py, x, y, width, height, radius) {
				img.SetNRGBA(px, py, c)
			}
		}
	}
}

func roundedRectContains(px, py, x, y, width, height, radius int) bool {
	if px >= x+radius && px < x+width-radius {
		return true
	}
	if py >= y+radius && py < y+height-radius {
		return true
	}

	corners := [][2]int{
		{x + radius, y + radius},
		{x + width - radius - 1, y + radius},
		{x + radius, y + height - radius - 1},
		{x + width - radius - 1, y + height - radius - 1},
	}

	for _, corner := range corners {
		dx := px - corner[0]
		dy := py - corner[1]
		if dx*dx+dy*dy <= radius*radius {
			return true
		}
	}

	return false
}

type point struct {
	x int
	y int
}

func fillTriangle(img *image.NRGBA, a, b, c point, fill color.NRGBA) {
	minX := min(a.x, min(b.x, c.x))
	maxX := max(a.x, max(b.x, c.x))
	minY := min(a.y, min(b.y, c.y))
	maxY := max(a.y, max(b.y, c.y))

	for y := minY; y <= maxY; y++ {
		for x := minX; x <= maxX; x++ {
			if pointInTriangle(point{x, y}, a, b, c) {
				img.SetNRGBA(x, y, fill)
			}
		}
	}
}

func pointInTriangle(p, a, b, c point) bool {
	denominator := float64((b.y-c.y)*(a.x-c.x) + (c.x-b.x)*(a.y-c.y))
	if denominator == 0 {
		return false
	}

	w1 := float64((b.y-c.y)*(p.x-c.x)+(c.x-b.x)*(p.y-c.y)) / denominator
	w2 := float64((c.y-a.y)*(p.x-c.x)+(a.x-c.x)*(p.y-c.y)) / denominator
	w3 := 1 - w1 - w2

	return w1 >= 0 && w2 >= 0 && w3 >= 0
}

func paint(img *image.NRGBA, x, y int, src color.NRGBA) {
	dst := img.NRGBAAt(x, y)
	srcAlpha := float64(src.A) / 255
	dstAlpha := float64(dst.A) / 255
	outAlpha := srcAlpha + dstAlpha*(1-srcAlpha)
	if outAlpha == 0 {
		return
	}

	r := (float64(src.R)*srcAlpha + float64(dst.R)*dstAlpha*(1-srcAlpha)) / outAlpha
	g := (float64(src.G)*srcAlpha + float64(dst.G)*dstAlpha*(1-srcAlpha)) / outAlpha
	b := (float64(src.B)*srcAlpha + float64(dst.B)*dstAlpha*(1-srcAlpha)) / outAlpha

	img.SetNRGBA(x, y, color.NRGBA{
		R: uint8(r),
		G: uint8(g),
		B: uint8(b),
		A: uint8(outAlpha * 255),
	})
}

func blend(a, b color.NRGBA, t float64) color.NRGBA {
	return color.NRGBA{
		R: uint8(float64(a.R) + (float64(b.R)-float64(a.R))*t),
		G: uint8(float64(a.G) + (float64(b.G)-float64(a.G))*t),
		B: uint8(float64(a.B) + (float64(b.B)-float64(a.B))*t),
		A: 255,
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
