function compute_line_circle_intersection(cx, cy, radius, dx,dy) {
	var ux = dx-cx;
	var uy = dy-cy;
	var ratio = radius/Math.sqrt(ux*ux + uy*uy);
	ux *= ratio;
	uy *= ratio;
	return {x: cx+ux,y: cy+uy };
}