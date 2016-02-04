// Compiled using typings@0.6.6
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/bd3b137455668434c60057c978f45df6b42b369b/JSONStream/JSONStream.d.ts
// Type definitions for JSONStream v0.8.0
// Project: http://github.com/dominictarr/JSONStream
// Definitions by: Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare module 'JSONStream' {

	export interface Options {
		recurse: boolean;
	}

	export function parse(pattern: any): NodeJS.ReadWriteStream;
	export function parse(patterns: any[]): NodeJS.ReadWriteStream;

	export function stringify(): NodeJS.ReadWriteStream;
	export function stringify(open: string, sep: string, close: string): NodeJS.ReadWriteStream;

	export function stringifyObject(): NodeJS.ReadWriteStream;
	export function stringifyObject(open: string, sep: string, close: string): NodeJS.ReadWriteStream;
}