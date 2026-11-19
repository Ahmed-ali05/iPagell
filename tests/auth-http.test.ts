import test from "node:test";
import assert from "node:assert/strict";
import { errorResponse, HttpError } from "../lib/server/http";

test("unexpected server errors never log SQL, passwords, tokens or provider exception text",async()=>{
  const original=console.error;
  const logged:unknown[][]=[];
  console.error=(...args)=>{logged.push(args);};
  try {
    const response=errorResponse(new Error("synthetic-password token=secret SQL bind(email@example.test)"));
    assert.equal(response.status,503);
    assert.equal(response.headers.get("Cache-Control"),"private, no-store");
    const output=JSON.stringify(logged)+JSON.stringify(await response.json());
    for(const value of ["synthetic-password","token=secret","email@example.test","SQL bind"])assert.equal(output.includes(value),false);
    assert.deepEqual(logged,[["iPagell server failure",{name:"Error"}]]);
    assert.equal(errorResponse(new HttpError(409,"Errore pubblico","PUBLIC_CODE")).status,409);
    assert.equal(logged.length,1);
  } finally {console.error=original;}
});
