import { ChangeEvent } from "react";

export type ObjectDeepPath = Array<string | number | Symbol>;

export interface ObserverChange {
   type: 'access' | 'insert' | 'update' | 'delete' | 'shuffle' | 'reverse';
   path: ObjectDeepPath[];
   value: any;
   oldValue: any;
   object: any;
}

export type ObserverChangesHandler = (changes: ObserverChange[]) => void;

export interface Options {
	enableGet?: boolean;
	path?: string;
	pathsOf?: string;
	pathsFrom?: string;
}

const
	ACCESS = 'access',
	INSERT = 'insert',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERSE = 'reverse',
	SHUFFLE = 'shuffle',
	sysObsKey = Symbol('system-observer-key'),
	validOptionsKeys = { path: 1, pathsOf: 1, pathsFrom: 1, enableGet: 1 },
	processObserveOptions = function (options: Options) {
		const result: any = {};
		if (typeof options.path !== 'undefined') {
			if (typeof options.path !== 'string') {
				console.error('"path" option, if/when provided, MUST be a non-empty string');
			} else {
				result.path = options.path;
			}
		}
		if (typeof options.pathsOf !== 'undefined') {
			if (options.path) {
				console.error('"pathsOf" option MAY NOT be specified together with "path" option');
			} else if (typeof options.pathsOf !== 'string') {
				console.error('"pathsOf" option, if/when provided, MUST be a non-empty string');
			} else {
				result.pathsOf = options.pathsOf.split('.').filter(n => n);
			}
		}
		if (typeof options.pathsFrom !== 'undefined') {
			if (options.path || options.pathsOf) {
				console.error('"pathsFrom" option MAY NOT be specified together with "path"/"pathsOf"  option/s');
			} else if (typeof options.pathsFrom !== 'string') {
				console.error('"pathsFrom" option, if/when provided, MUST be a non-empty string');
			} else {
				result.pathsFrom = options.pathsFrom;
			}
		}
		if (typeof options.enableGet !== 'undefined') {
			if (typeof options.enableGet !== 'boolean') {
				console.error('"enableGet" option, if/when provided, MUST be a boolean');
			} else {
				result.enableGet = options.enableGet;
			}
		}
		const invalidOptions = Object.keys(options).filter(option => !validOptionsKeys.hasOwnProperty(option));
		if (invalidOptions.length) {
			console.error(`'${invalidOptions.join(', ')}' is/are not a valid option/s`);
		}
		return result;
	},
	observe = function observe(this: any, observer: ObserverChangesHandler, options: Options) {
		if (typeof observer !== 'function') {
			throw new Error('observer parameter MUST be a function');
		}

		const
			systemObserver = this[sysObsKey],
			observers = systemObserver.observers;
		if (!observers.some((o: any) => o[0] === observer)) {
			let opts;
			if (options) {
				opts = processObserveOptions(options);
			} else {
				opts = {};
			}
			observers.push([observer, opts]);
		} else {
			console.info('observer may be bound to an observable only once');
		}
	},
	unobserve = function unobserve(this: any) {
		const systemObserver = this[sysObsKey];
		const observers = systemObserver.observers;
		let ol = observers.length;
		if (ol) {
			let al = arguments.length;
			if (al) {
				while (al--) {
					let i = ol;
					while (i--) {
						if (observers[i][0] === arguments[al]) {
							observers.splice(i, 1);
							ol--;
						}
					}
				}
			} else {
				observers.splice(0);
			}
		}
	},
	prepareArray = function (source: any, observer: any) {
		let l = source.length, item;
		const target = Object.defineProperties(new Array(l), { [sysObsKey]: { value: observer }, observe: { value: observe }, unobserve: { value: unobserve } });
		while (l--) {
			item = source[l];
			if (!item || typeof item !== 'object') {
				target[l] = item;
			} else {
				target[l] = getObservedOf(item, l, observer);
			}
		}
		return target;
	},
	prepareObject = function (source: any, observer: any) {
		const
			keys = Object.keys(source),
			target = Object.defineProperties({}, { [sysObsKey]: { value: observer }, observe: { value: observe }, unobserve: { value: unobserve } });
		let l = keys.length, key, item;
		while (l--) {
			key = keys[l];
			item = source[key];
			if (!item || typeof item !== 'object') {
				target[key] = item;
			} else {
				target[key] = getObservedOf(item, key, observer);
			}
		}
		return target;
	},
	callObservers = function (observed: any, changes: any[]) {
		let observers, pair, target, options: any, relevantChanges, oPath: any, oPaths: any, i, newPath, tmp;
		const l = changes.length;
		do {
			observers = observed.observers;
			i = observers.length;
			while (i--) {
				try {
					pair = observers[i];
					target = pair[0];
					options = pair[1];
					relevantChanges = changes;

					if (options.path) {
						oPath = options.path;
						relevantChanges = changes.filter(change => change.path.join('.') === oPath);
					} else if (options.pathsOf) {
						relevantChanges = changes.filter(change => change.path.length === options.pathsOf.length + 1);
					} else if (options.pathsFrom) {
						oPaths = options.pathsFrom;
						relevantChanges = changes.filter(change => change.path.join('.').startsWith(oPaths));
					}
					if (!options.enableGet) {
						relevantChanges = changes.filter(change => change.type !== ACCESS);
					}
					if (relevantChanges.length) {
						target(relevantChanges);
					}
				} catch (e) {
					console.error(`failed to deliver changes to listener ${target}`, e);
				}
			}

			let tmpa;
			if (observed.parent) {
				tmpa = new Array(l);
				for (let i = 0; i < l; i++) {
					tmp = changes[i];
					newPath = [observed.ownKey];
					Array.prototype.push.apply(newPath, tmp.path);
					tmpa[i] = {
						type: tmp.type,
						path: newPath,
						value: tmp.value,
						oldValue: tmp.oldValue,
						object: tmp.object
					};
				}
				changes = tmpa;
				observed = observed.parent;
			} else {
				break;
			}
		} while (true);
	},
	getObservedOf = function (item: any, key: any, parent: any) {
		if (!item || typeof item !== 'object') {
			return item;
		} else if (Array.isArray(item)) {
			return (new ArrayObserver({ target: item, ownKey: key, parent: parent }) as any).proxy;
		} else if (item instanceof Date || item instanceof Blob || item instanceof Error) {
			return item;
		} else {
			return (new ObjectObserver({ target: item, ownKey: key, parent: parent }) as any).proxy;
		}
	},
	proxiedArrayMethods = {
		pop: function proxiedPop(target: any, observed: any) {
			const poppedIndex = target.length - 1;
			let popResult = target.pop();
			if (popResult && typeof popResult === 'object') {
				const tmpObserved = popResult[sysObsKey];
				if (tmpObserved) {
					popResult = tmpObserved.detach();
				}
			}

			const changes = [{ type: DELETE, path: [poppedIndex], oldValue: popResult, object: observed.proxy }];
			callObservers(observed, changes);

			return popResult;
		},
		push: function proxiedPush(target: any, observed: any) {
			const
				l = arguments.length - 2,
				pushContent = new Array(l),
				initialLength = target.length;
			let item;

			for (let i = 0; i < l; i++) {
				item = arguments[i + 2];
				pushContent[i] = getObservedOf(item, initialLength + i, observed);
			}
			const pushResult = Reflect.apply(target.push, target, pushContent);

			const changes = [];
			for (let i = initialLength, l = target.length; i < l; i++) {
				changes[i - initialLength] = { type: INSERT, path: [i], value: target[i], object: observed.proxy };
			}
			callObservers(observed, changes);

			return pushResult;
		},
		shift: function proxiedShift(target: any, observed: any) {
			let shiftResult, i, l, item, tmpObserved;

			shiftResult = target.shift();
			if (shiftResult && typeof shiftResult === 'object') {
				tmpObserved = shiftResult[sysObsKey];
				if (tmpObserved) {
					shiftResult = tmpObserved.detach();
				}
			}

			//	update indices of the remaining items
			for (i = 0, l = target.length; i < l; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					}
				}
			}

			const changes = [{ type: DELETE, path: [0], oldValue: shiftResult, object: observed.proxy }];
			callObservers(observed, changes);

			return shiftResult;
		},
		unshift: function proxiedUnshift(target: any, observed: any) {
			const unshiftContent = Array.from(arguments);
			unshiftContent.splice(0, 2);
			unshiftContent.forEach((item, index) => {
				unshiftContent[index] = getObservedOf(item, index, observed);
			});
			const unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);
			for (let i = 0, l = target.length, item; i < l; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					const tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					}
				}
			}

			//	publish changes
			const l = unshiftContent.length;
			const changes = new Array(l);
			for (let i = 0; i < l; i++) {
				changes[i] = { type: INSERT, path: [i], value: target[i], object: observed.proxy };
			}
			callObservers(observed, changes);

			return unshiftResult;
		},
		reverse: function proxiedReverse(target: any, observed: any) {
			let i, l, item;
			target.reverse();
			for (i = 0, l = target.length; i < l; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					const tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					}
				}
			}

			const changes = [{ type: REVERSE, path: [], object: observed.proxy }];
			callObservers(observed, changes);

			return observed.proxy;
		},
		sort: function proxiedSort(target: any, observed: any, comparator: any) {
			let i, l, item;
			target.sort(comparator);
			for (i = 0, l = target.length; i < l; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					const tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					}
				}
			}

			const changes = [{ type: SHUFFLE, path: [], object: observed.proxy }];
			callObservers(observed, changes);

			return observed.proxy;
		},
		fill: function proxiedFill(target: any, observed: any) {
			const
				changes = [],
				tarLen = target.length,
				normArgs = Array.from(arguments);
			normArgs.splice(0, 2);
			const
				argLen = normArgs.length,
				start = argLen < 2 ? 0 : (normArgs[1] < 0 ? tarLen + normArgs[1] : normArgs[1]),
				end = argLen < 3 ? tarLen : (normArgs[2] < 0 ? tarLen + normArgs[2] : normArgs[2]),
				prev = target.slice(0);
			Reflect.apply(target.fill, target, normArgs);

			let tmpObserved;
			for (let i = start, item, tmpTarget; i < end; i++) {
				item = target[i];
				target[i] = getObservedOf(item, i, observed);
				if (prev.hasOwnProperty(i)) {
					tmpTarget = prev[i];
					if (tmpTarget && typeof tmpTarget === 'object') {
						tmpObserved = tmpTarget[sysObsKey];
						if (tmpObserved) {
							tmpTarget = tmpObserved.detach();
						}
					}

					changes.push({ type: UPDATE, path: [i], value: target[i], oldValue: tmpTarget, object: observed.proxy });
				} else {
					changes.push({ type: INSERT, path: [i], value: target[i], object: observed.proxy });
				}
			}

			callObservers(observed, changes);

			return observed.proxy;
		},
		splice: function proxiedSplice(target: any, observed: any) {
			const
				spliceContent = Array.from(arguments),
				tarLen = target.length;

			spliceContent.splice(0, 2);
			const splLen = spliceContent.length;

			//	observify the newcomers
			for (let i = 2, item; i < splLen; i++) {
				item = spliceContent[i];
				spliceContent[i] = getObservedOf(item, i, observed);
			}

			//	calculate pointers
			const
				startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]),
				removed = splLen < 2 ? tarLen - startIndex : spliceContent[1],
				inserted = Math.max(splLen - 2, 0),
				spliceResult = Reflect.apply(target.splice, target, spliceContent),
				newTarLen = target.length;

			//	reindex the paths
			let tmpObserved;
			for (let i = 0, item; i < newTarLen; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					}
				}
			}

			//	detach removed objects
			let i, l, item;
			for (i = 0, l = spliceResult.length; i < l; i++) {
				item = spliceResult[i];
				if (item && typeof item === 'object') {
					tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						spliceResult[i] = tmpObserved.detach();
					}
				}
			}

			const changes = [];
			let index;
			for (index = 0; index < removed; index++) {
				if (index < inserted) {
					changes.push({ type: UPDATE, path: [startIndex + index], value: target[startIndex + index], oldValue: spliceResult[index], object: observed.proxy });
				} else {
					changes.push({ type: DELETE, path: [startIndex + index], oldValue: spliceResult[index], object: observed.proxy });
				}
			}
			for (; index < inserted; index++) {
				changes.push({ type: INSERT, path: [startIndex + index], value: target[startIndex + index], object: observed.proxy });
			}
			callObservers(observed, changes);

			return spliceResult;
		}
	};

class ObserverBase {
	parent: any;
	ownKey: any;
	observers: any;
	revokable: any;
	proxy: any;
	target: any;
	constructor(properties: any, cloningFunction: any) {
		const
			source = properties.target,
			parent = properties.parent,
			ownKey = properties.ownKey;
		if (parent && ownKey !== undefined) {
			this.parent = parent;
			this.ownKey = ownKey;
		} else {
			this.parent = null;
			this.ownKey = null;
		}
		const targetClone = cloningFunction(source, this);
		this.observers = [];
		this.revokable = Proxy.revocable(targetClone, this);
		this.proxy = this.revokable.proxy;
		this.target = targetClone;
	}

	get(target: any, key: any, receiver: any) {
		const value = Reflect.get(target, key, receiver);
		const changes = [{ type: ACCESS, path: [key], value, object: this.proxy }];
		callObservers(this, changes);
		return value;
	}

	set(target: any, key: any, value: any) {
		let oldValue = target[key];

		if (value === oldValue) {
			return true;
		}

		const newValue = getObservedOf(value, key, this);
		target[key] = newValue;

		if (oldValue && typeof oldValue === 'object') {
			const tmpObserved = oldValue[sysObsKey];
			if (tmpObserved) {
				oldValue = tmpObserved.detach();
			}
		}

		const changes = typeof oldValue === 'undefined'
			? [{ type: INSERT, path: [key], value: newValue, object: this.proxy }]
			: [{ type: UPDATE, path: [key], value: newValue, oldValue: oldValue, object: this.proxy }];
		callObservers(this, changes);

		return true;
	}

	deleteProperty(target: any, key: any) {
		let oldValue = target[key];

		delete target[key];

		if (oldValue && typeof oldValue === 'object') {
			const tmpObserved = oldValue[sysObsKey];
			if (tmpObserved) {
				oldValue = tmpObserved.detach();
			}
		}

		const changes = [{ type: DELETE, path: [key], oldValue: oldValue, object: this.proxy }];
		callObservers(this, changes);

		return true;
	}
}

class ArrayObserver extends ObserverBase {
	constructor(properties: any) {
		super(properties, prepareArray);
	}

	detach() {
		this.parent = null;
		return this.target;
	}

	get(target: any, key: any) {
		if (proxiedArrayMethods.hasOwnProperty(key)) {
			return ((proxiedArrayMethods as any)[key] as any).bind(undefined, target, this);
		} else {
			return target[key];
		}
	}
}

class ObjectObserver extends ObserverBase {
	constructor(properties: any) {
		super(properties, prepareObject);
	}

	detach() {
		this.parent = null;
		return this.target;
	}
}

class Observable {
	constructor() {
		throw new Error('Observable MAY NOT be created via constructor, see "Observable.from" API');
	}

	static from(target: any) {
		if (!target || typeof target !== 'object') {
			throw new Error('observable MAY ONLY be created from a non-null object');
		} else if (target[sysObsKey]) {
			return target;
		} else if (Array.isArray(target)) {
			return new ArrayObserver({ target: target, ownKey: null, parent: null }).proxy;
		} else if (target instanceof Date || target instanceof Blob || target instanceof Error) {
			throw new Error(`${target} found to be one of non-observable types`);
		} else {
			return new ObjectObserver({ target: target, ownKey: null, parent: null }).proxy;
		}
	}

	static isObservable(input: any) {
		return !!(input && input[sysObsKey]);
	}
}

Object.freeze(Observable);

export { Observable };