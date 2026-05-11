// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	interface D1PreparedStatement {
		bind(...values: unknown[]): D1PreparedStatement;
		run(): Promise<{ success: boolean }>;
		all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
		first<T = Record<string, unknown>>(): Promise<T | null>;
	}

	interface D1Database {
		prepare(query: string): D1PreparedStatement;
		exec(query: string): Promise<{ count: number; duration: number }>;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
		}
	}
}

export {};
