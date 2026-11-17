import { test } from "node:test";
import assert from "node:assert/strict";
import { read, remembering, setRemembering, write } from "./prefs.ts";

/** A browser storage stand-in. */
class Store {
	m = new Map<string, string>();
	getItem(k: string) {
		return this.m.get(k) ?? null;
	}
	setItem(k: string, v: string) {
		this.m.set(k, String(v));
	}
	removeItem(k: string) {
		this.m.delete(k);
	}
}
const fresh = () => {
	const local = new Store();
	const session = new Store();
	Object.assign(globalThis, { localStorage: local, sessionStorage: session });
	return { local, session };
};

test("by default choices are remembered in this browser", () => {
	const { local, session } = fresh();
	assert.equal(remembering(), true);
	write("theme", "dark");
	assert.equal(local.getItem("theme"), "dark");
	assert.equal(session.m.size, 0);
	assert.equal(read("theme"), "dark");
});

test("turned off, nothing but the 'no' stays in this browser, and the choices last only for the tab", () => {
	const { local, session } = fresh();
	write("theme", "dark");
	write("experience", "3d");
	local.setItem("someone-else", "x"); // another app on the same origin is left alone
	setRemembering(false);
	assert.equal(remembering(), false);
	assert.deepEqual([...local.m.keys()].sort(), ["remember", "someone-else"]);
	assert.equal(local.getItem("remember"), "no");
	assert.equal(read("theme"), "dark"); // still in force for this tab
	write("surface", "solid");
	assert.equal(local.getItem("surface"), null);
	assert.equal(session.getItem("surface"), "solid");
});

test("turned back on, the tab's choices are kept again and the 'no' is gone", () => {
	const { local, session } = fresh();
	setRemembering(false);
	write("theme", "light");
	setRemembering(true);
	assert.equal(remembering(), true);
	assert.equal(local.getItem("remember"), null);
	assert.equal(local.getItem("theme"), "light");
	assert.equal(session.getItem("theme"), null);
});

test("with storage blocked, nothing is kept and nothing throws", () => {
	const blocked = {
		getItem() {
			throw new Error("blocked");
		},
		setItem() {
			throw new Error("blocked");
		},
		removeItem() {
			throw new Error("blocked");
		},
	};
	Object.assign(globalThis, { localStorage: blocked, sessionStorage: blocked });
	assert.equal(remembering(), false);
	write("theme", "dark");
	setRemembering(false);
	assert.equal(read("theme"), null);
});
