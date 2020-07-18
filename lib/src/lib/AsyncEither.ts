import { Either as E, EitherObj as Either, Left } from './Either';

const errorHandler = <L>(errorValue: L | ((err: Error) => L)) => (err: Error): Left<L> =>
	E.left(typeof errorValue === 'function' ? (errorValue as (err: Error) => L)(err) : errorValue);

export const isPromise = (v: any): v is Promise<any> => !!v && !!v.then;

// Used because the current setup doesn't always include errors like type errors easily
const errorWrap = async <L, R, T extends any[]>(
	f: (...args: T) => R | Promise<R>,
	errorValue: L | ((err: Error) => L),
	...args: T
): Promise<Either<L, R>> => {
	try {
		const value = await f(...args);

		return E.right(value);
	} catch (e) {
		return E.left(
			typeof errorValue === 'function' ? (errorValue as (err: Error) => L)(e) : errorValue
		);
	}
};

export class AsyncEither<L, R> implements PromiseLike<Either<L, R>> {
	public static All<L, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(
		values: [
			AsyncEither<L, R1>,
			AsyncEither<L, R2>,
			AsyncEither<L, R3>,
			AsyncEither<L, R4>,
			AsyncEither<L, R5>,
			AsyncEither<L, R6>,
			AsyncEither<L, R7>,
			AsyncEither<L, R8>,
			AsyncEither<L, R9>,
			AsyncEither<L, R10>
		]
	): AsyncEither<L, [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10]>;
	public static All<L, R1, R2, R3, R4, R5, R6, R7, R8, R9>(
		values: [
			AsyncEither<L, R1>,
			AsyncEither<L, R2>,
			AsyncEither<L, R3>,
			AsyncEither<L, R4>,
			AsyncEither<L, R5>,
			AsyncEither<L, R6>,
			AsyncEither<L, R7>,
			AsyncEither<L, R8>,
			AsyncEither<L, R9>
		]
	): AsyncEither<L, [R1, R2, R3, R4, R5, R6, R7, R8, R9]>;
	public static All<L, R1, R2, R3, R4, R5, R6, R7, R8>(
		values: [
			AsyncEither<L, R1>,
			AsyncEither<L, R2>,
			AsyncEither<L, R3>,
			AsyncEither<L, R4>,
			AsyncEither<L, R5>,
			AsyncEither<L, R6>,
			AsyncEither<L, R7>,
			AsyncEither<L, R8>
		]
	): AsyncEither<L, [R1, R2, R3, R4, R5, R6, R7, R8]>;
	public static All<L, R1, R2, R3, R4, R5, R6, R7>(
		values: [
			AsyncEither<L, R1>,
			AsyncEither<L, R2>,
			AsyncEither<L, R3>,
			AsyncEither<L, R4>,
			AsyncEither<L, R5>,
			AsyncEither<L, R6>,
			AsyncEither<L, R7>
		]
	): AsyncEither<L, [R1, R2, R3, R4, R5, R6, R7]>;
	public static All<L, R1, R2, R3, R4, R5, R6>(
		values: [
			AsyncEither<L, R1>,
			AsyncEither<L, R2>,
			AsyncEither<L, R3>,
			AsyncEither<L, R4>,
			AsyncEither<L, R5>,
			AsyncEither<L, R6>
		]
	): AsyncEither<L, [R1, R2, R3, R4, R5, R6]>;
	public static All<L, R1, R2, R3, R4, R5>(
		values: [
			AsyncEither<L, R1>,
			AsyncEither<L, R2>,
			AsyncEither<L, R3>,
			AsyncEither<L, R4>,
			AsyncEither<L, R5>
		]
	): AsyncEither<L, [R1, R2, R3, R4, R5]>;
	public static All<L, R1, R2, R3, R4>(
		values: [AsyncEither<L, R1>, AsyncEither<L, R2>, AsyncEither<L, R3>, AsyncEither<L, R4>]
	): AsyncEither<L, [R1, R2, R3, R4]>;
	public static All<L, R1, R2, R3>(
		values: [AsyncEither<L, R1>, AsyncEither<L, R2>, AsyncEither<L, R3>]
	): AsyncEither<L, [R1, R2, R3]>;
	public static All<L, R1, R2>(
		values: [AsyncEither<L, R1>, AsyncEither<L, R2>]
	): AsyncEither<L, [R1, R2]>;
	public static All<L, R>(values: [AsyncEither<L, R>]): AsyncEither<L, [R]>;
	public static All<L, R>(values: Array<AsyncEither<L, R>>): AsyncEither<L, R[]>;

	public static All<L, R>(values: any[]): AsyncEither<L, any> {
		const results = Promise.all(values.map(value => value.fullJoin()));
		// This works because the value rejected in Promise.all would be the value rejected by an AsyncEither<L, R> type
		// Ensuring that the value passed to Promise.reject is of type L
		return asyncRight(results, (err: Error): L => (err as unknown) as L);
	}

	public static Left = <L, R>(value: L) =>
		new AsyncEither<L, R>(Promise.resolve(E.left<L, R>(value)), value);

	public static Right = <L, R>(value: R | Promise<R>, errorValue: L | ((err: Error) => L)) => {
		return new AsyncEither<L, R>(
			isPromise(value)
				? value.then(v => E.right<L, R>(v), errorHandler(errorValue))
				: Promise.resolve(E.right<L, R>(value)),
			errorValue
		);
	};

	public constructor(
		public readonly value: Promise<Either<L, R>>,
		public readonly errorValue: L | ((err: Error) => L)
	) {}

	public isLeft = (): Promise<boolean> => this.value.then(E.isLeft, () => true);

	public isRight = (): Promise<boolean> => this.value.then(E.isRight, () => false);

	public leftMap = <L2>(
		f: (val: L) => L2,
		errorValue: L2 | ((error: Error) => L2)
	): AsyncEither<L2, R> =>
		new AsyncEither(
			this.value.then(
				E.cata<L, R, Promise<Either<L2, R>>>(value =>
					errorWrap(f, errorValue, value).then(v => E.left<L2, R>(v.value))
				)(value => Promise.resolve(E.right<L2, R>(value))),
				errorHandler(errorValue)
			),
			errorValue
		);

	public leftFlatMap = (f: (val: L) => Either<L, R>): AsyncEither<L, R> =>
		new AsyncEither(
			this.value
				.then(
					value =>
						E.cata<L, R, AsyncEither<L, R>>(val => {
							const newEith = f(val);

							if (newEith instanceof AsyncEither) {
								return newEith;
							} else {
								return new AsyncEither(Promise.resolve(newEith), this.errorValue);
							}
						})(right => asyncRight(right, this.errorValue))(value).value
				)
				.catch(errorHandler(this.errorValue)),
			this.errorValue
		);

	public map = <R2>(
		f: (val: R) => Promise<R2> | R2,
		errorValue = this.errorValue
	): AsyncEither<L, R2> =>
		new AsyncEither(
			this.value
				.then(
					E.cata<L, R, Promise<Either<L, R2>>>(value =>
						Promise.resolve(E.left(value))
					)(value => errorWrap(f, errorValue, value))
				)
				.catch(errorHandler(errorValue)),
			errorValue
		);

	public flatMap = <R2>(
		f: (val: R) => Either<L, R2> | AsyncEither<L, R2> | Promise<Either<L, R2>>,
		errorValue = this.errorValue
	): AsyncEither<L, R2> =>
		new AsyncEither(
			this.value
				.then(
					value =>
						E.cata<L, R, AsyncEither<L, R2>>(asyncLeft)(val => {
							const newEith = f(val);

							if (newEith instanceof AsyncEither) {
								return newEith;
							} else {
								return new AsyncEither(Promise.resolve(newEith), errorValue);
							}
						})(value).value
				)
				.catch(errorHandler(errorValue)),
			errorValue
		);

	public join = (): Promise<Either<L, R>> => this.value;

	public fullJoin = (): Promise<R> =>
		this.value.then(
			E.cata<L, R, Promise<R>>(v => Promise.reject(v))(v => Promise.resolve(v))
		);

	public cata = <T>(lf: (v: L) => Promise<T> | T, rf: (v: R) => Promise<T> | T): Promise<T> =>
		this.value.then(E.cata<L, R, T | Promise<T>>(lf)(rf));

	public tap = (
		rf: (v: R) => Promise<void> | Promise<any> | void | any,
		errorValue = this.errorValue
	): AsyncEither<L, R> =>
		new AsyncEither(
			this.value
				.then(
					E.cata<L, R, Promise<Either<L, R>>>(left =>
						Promise.resolve(E.left(left))
					)(right => errorWrap(rf, errorValue, right).then(() => E.right(right)))
				)
				.catch(errorHandler(errorValue)),
			errorValue
		);

	public leftTap = (
		lf: (v: L) => Promise<void> | Promise<any> | void | any,
		errorValue = this.errorValue
	): AsyncEither<L, R> =>
		new AsyncEither(
			this.value
				.then(
					E.cata<L, R, Promise<Either<L, R>>>(left =>
						errorWrap(lf, errorValue, left).then(() => E.left(left))
					)(right => Promise.resolve(E.right(right)))
				)
				.catch(errorHandler(errorValue)),
			errorValue
		);

	public setErrorValue = (errorValue: L | ((err: Error) => L)) =>
		new AsyncEither(this.value, errorValue);

	public filter = (
		predicate: (v: R) => AsyncEither<L, boolean> | Promise<boolean> | boolean,
		failedFilterResult: L,
		errorValue = this.errorValue
	): AsyncEither<L, R> =>
		new AsyncEither(
			this.value
				.then(
					E.cata<L, R, Promise<Either<L, R>>>(l => Promise.resolve(E.left(l)))(
						async r => {
							try {
								const pred = predicate(r);
								const keep = await (pred instanceof AsyncEither
									? pred.value
									: Promise.resolve(pred).then(E.right));

								return E.flatMap<L, boolean, R>(shouldKeep =>
									shouldKeep ? E.right(r) : E.left(failedFilterResult)
								)(keep);
							} catch (e) {
								return errorHandler(errorValue)(e);
							}
						}
					)
				)
				.catch(errorHandler(errorValue)),
			errorValue
		);

	// The rejected function is named something long so the formatting is pretty and consistent
	public async then<T1 = Either<L, R>, T2 = Either<L, R>>(
		onfulfilled?: ((value: Either<L, R>) => T1 | PromiseLike<T1>) | undefined | null,
		onRejectedWithLongName?: ((reason: any) => T2 | PromiseLike<T2>) | undefined | null
	): Promise<T1 | T2> {
		try {
			const val = await this.value;
			return onfulfilled
				? onfulfilled(val)
				: ((Promise.resolve(val) as unknown) as PromiseLike<T1>);
		} catch (val1) {
			if (onRejectedWithLongName) {
				return onRejectedWithLongName(E.left(val1));
			}
			return (E.left(val1) as unknown) as T2;
		}
	}
}

export const asyncLeft = AsyncEither.Left;
export const asyncRight = AsyncEither.Right;
export const asyncEither = <L, R>(
	eith: Either<L, R>,
	errorValue: L | ((err: Error) => L)
): AsyncEither<L, R> =>
	E.cata<L, R, AsyncEither<L, R>>(asyncLeft)(r => asyncRight(r, errorValue))(eith);
