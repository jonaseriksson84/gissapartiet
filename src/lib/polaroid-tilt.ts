const TILT_BOUND = 1.8;
const TAPE_BOUND = 6;

function fnv1a(input: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

function normalize(value: number, bound: number): number {
	// value ∈ [0, 65535] → [-bound, bound]
	return (value / 65535) * (2 * bound) - bound;
}

export function tiltForMpId(id: string): number {
	if (id === '') return 0;
	const h = fnv1a(id);
	return normalize(h & 0xffff, TILT_BOUND);
}

export function tapeAngleForMpId(id: string): number {
	if (id === '') return 0;
	const h = fnv1a(id);
	return normalize((h >>> 16) & 0xffff, TAPE_BOUND);
}
