import assert from "node:assert/strict";
import { test } from "node:test";
import { splashFor } from "./splash.ts";

test("each page gets its own logo intro, on the site and under a project-site prefix", () => {
	assert.equal(splashFor("/"), "jpl");
	assert.equal(splashFor("/work/"), "jpl");
	assert.equal(splashFor("/work/frc/"), "frc");
	assert.equal(splashFor("/work/drone/"), "drone");
	assert.equal(splashFor("/work/lifetime/"), "lifetime");
	assert.equal(splashFor("/work/lifetime"), "lifetime");
	assert.equal(splashFor("/jpl_site2/work/lifetime/"), "lifetime");
	assert.equal(splashFor("/work/lifetime-extra/"), "jpl");
});
