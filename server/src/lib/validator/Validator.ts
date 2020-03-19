/* tslint:disable:member-ordering */
import {
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	left,
	MemberReference,
	MultCheckboxWithOtherSelected,
	MultCheckboxWithoutOtherSelected,
	none,
	OtherMultCheckboxReturn,
	RadioReturnWithOther,
	RadioReturnWithOtherSelected,
	RadioReturnWithoutOtherSelected,
	SimpleMultCheckboxReturn
} from 'common-lib';
import * as express from 'express';
import { BasicAccountRequest } from '../Account';
import {
	AccountRequest,
	ConditionalMemberRequest,
	isValidMemberReference,
	MemberRequest,
	ParamType
} from '../internals';
import { BasicConditionalMemberRequest, BasicMemberRequest } from '../member/pam/Session';
import { serverErrorGenerator } from '../Util';

interface ValidatorResult {
	valid: boolean;
}

export interface ValidatorFail<T> extends ValidatorResult {
	valid: false;
	message: string;
	// IGNORE!! DO NOT USE!! IT WILL NEVER BE SET, IT'S JUST
	// FOR ENFORCING TYPE CHECKING WITH GENERIC TYPES
	ret?: T;
}

export interface ValidatorPass<T> extends ValidatorResult {
	valid: true;
	// IGNORE!! DO NOT USE!! IT WILL NEVER BE SET, IT'S JUST
	// FOR ENFORCING TYPE CHECKING WITH GENERIC TYPES
	ret?: T;
}

export type ValidatorFunction<T> = (obj: unknown) => ValidatorFail<T> | ValidatorPass<T>;

type RequiredCheckFunction<T> = (value: T, baseObj: any) => boolean;

interface ValidateRule<T> {
	validator: ValidatorFunction<T> | Validator<T>;
	required?: boolean;
	requiredIf?: RequiredCheckFunction<T>;
}

export type ValidateRuleSet<T> = { [P in keyof T]: ValidateRule<T[P]> };

interface ValidateError<T> {
	property: keyof T;
	message: string;
}

export type SimpleValidatedRequest<T, P extends ParamType = {}> = AccountRequest<P, T>;

export type MemberValidatedRequest<T, P extends ParamType = {}> = MemberRequest<P, T>;

export type ConditionalMemberValidatedRequest<
	T,
	P extends ParamType = {}
> = ConditionalMemberRequest<P, T>;

export type PartialValidatedRequest<T, P extends ParamType = {}> = AccountRequest<P, Partial<T>>;

export type PartialMemberValidatedRequest<T, P extends ParamType = {}> = MemberRequest<
	P,
	Partial<T>
>;

export type PartialConditionalMemberValidatedRequest<
	T,
	P extends ParamType = {}
> = BasicConditionalMemberRequest<P, Partial<T>>;

export type BasicSimpleValidatedRequest<T, P extends ParamType = {}> = BasicAccountRequest<P, T>;

export type BasicMemberValidatedRequest<T, P extends ParamType = {}> = BasicMemberRequest<P, T>;

export type BasicConditionalMemberValidatedRequest<
	T,
	P extends ParamType = {}
> = BasicConditionalMemberRequest<P, T>;

export type BasicPartialValidatedRequest<T, P extends ParamType = {}> = BasicAccountRequest<
	P,
	Partial<T>
>;

export type BasicPartialMemberValidatedRequest<T, P extends ParamType = {}> = BasicMemberRequest<
	P,
	Partial<T>
>;

export type BasicPartialConditionalMemberValidatedRequest<
	T,
	P extends ParamType = {}
> = BasicConditionalMemberRequest<P, Partial<T>>;

export default class Validator<T> {
	public static BodyExpressMiddleware = (
		validator: Validator<any> | ValidatorFunction<any>
	): express.RequestHandler => (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			res.end();
			return;
		}

		if (validator instanceof Validator) {
			if (validator.validate(req.body)) {
				req.body = validator.prune(req.body);

				next();
			} else {
				res.status(400);
				res.json(validator.getErrors());
			}
		} else {
			const results = validator(req.body);

			if (results.valid) {
				next();
			} else {
				res.status(400);
				res.json((results as ValidatorFail<any>).message);
			}
		}
	};

	public static LeftyBodyExpressMiddleware = (
		validator: Validator<any> | ValidatorFunction<any>
	): express.RequestHandler => (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			return res.json(
				left({
					code: 400,
					error: 'Invalid body provided'
				})
			);
		}

		if (validator instanceof Validator) {
			if (validator.validate(req.body)) {
				req.body = validator.prune(req.body);

				next();
			} else {
				res.status(400);
				res.json(
					left({
						code: 400,
						message: validator.getErrors()
					})
				);
			}
		} else {
			const results = validator(req.body);

			if (results.valid) {
				next();
			} else {
				res.status(400);
				res.json(
					left({
						code: 400,
						message: (results as ValidatorFail<any>).message
					})
				);
			}
		}
	};

	public static PartialBodyExpressMiddleware = (
		validator: Validator<any>
	): express.RequestHandler => (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			res.end();
			return;
		}

		if (validator.validate(req.body, true)) {
			req.body = validator.partialPrune(req.body);

			next();
		} else {
			res.status(400);
			res.json(validator.getErrors());
		}
	};

	public static LeftyPartialBodyExpressMiddleware = (
		validator: Validator<any>
	): express.RequestHandler => (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			return res.json({
				code: 400,
				error: 'Invalid body provided'
			});
		}

		if (validator.validate(req.body, true)) {
			req.body = validator.partialPrune(req.body);

			next();
		} else {
			res.status(400);
			res.json({
				code: 400,
				message: validator.getErrors()
			});
		}
	};

	public static Nothing: ValidatorFunction<undefined | null> = (input: unknown) =>
		input === undefined || input === null
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be null or undefined'
			  };

	public static Null: ValidatorFunction<null> = (input: unknown) =>
		input === null
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be null'
			  };

	public static Anything: ValidatorFunction<any> = (input: unknown) => ({
		valid: true
	});

	public static Number: ValidatorFunction<number> = (input: unknown) =>
		typeof input === 'number'
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be a number'
			  };

	public static String: ValidatorFunction<string> = (input: unknown) =>
		typeof input === 'string'
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be a string'
			  };

	public static Boolean: ValidatorFunction<boolean> = (input: unknown) =>
		typeof input === 'boolean'
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be a boolean'
			  };

	public static Array: ValidatorFunction<any[]> = (input: unknown) =>
		Array.isArray(input)
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be an array'
			  };

	public static Enum = <E extends number>(value: any): ValidatorFunction<E> => (input: unknown) =>
		typeof value[input as any] !== 'string'
			? {
					valid: false,
					message: 'not a proper enum variable'
			  }
			: {
					valid: true
			  };

	public static ArrayOf = <S>(
		validator: ValidatorFunction<S> | Validator<S>
	): ValidatorFunction<S[]> => {
		const valid: ValidatorFunction<S[]> = (input: unknown) => {
			if (!Array.isArray(input)) {
				return {
					valid: false,
					message: 'must be an array'
				};
			}

			let good = true;
			let firstfail: string | null = null;

			for (const i of input) {
				if (validator instanceof Validator) {
					if (!validator.validate(i)) {
						good = false;
						firstfail = validator.getErrorString();
						break;
					}
				} else {
					if (!validator(i).valid) {
						good = false;
						break;
					}
				}
			}

			return good
				? {
						valid: true
				  }
				: {
						valid: false,
						message: `elements in the array do not match the required type (e.g., the first element to fail has message: ${firstfail})`
				  };
		};

		// @ts-ignore
		valid.validator = validator;

		return valid;
	};

	public static Or<S1>(validator1: Validator<S1> | ValidatorFunction<S1>): ValidatorFunction<S1>;
	public static Or<S1, S2>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>
	): ValidatorFunction<S1 | S2>;
	public static Or<S1, S2, S3>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>
	): ValidatorFunction<S1 | S2 | S3>;
	public static Or<S1, S2, S3, S4>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>
	): ValidatorFunction<S1 | S2 | S3 | S4>;
	public static Or<S1, S2, S3, S4, S5>(
		validator1: Validator<S1> | ValidatorFunction<S5>,
		validator2: Validator<S2> | ValidatorFunction<S5>,
		validator3: Validator<S3> | ValidatorFunction<S5>,
		validator4: Validator<S4> | ValidatorFunction<S5>,
		validator5: Validator<S5> | ValidatorFunction<S5>
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5>;
	public static Or<S1, S2, S3, S4, S5, S6>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6>;
	public static Or<S1, S2, S3, S4, S5, S6, S7>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7>;
	public static Or<S1, S2, S3, S4, S5, S6, S7, S8>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>,
		validator8: Validator<S8> | ValidatorFunction<S8>
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8>;
	public static Or<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>,
		validator8: Validator<S8> | ValidatorFunction<S8>,
		validator9: Validator<S9> | ValidatorFunction<S9>
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9>;
	public static Or<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>,
		validator8: Validator<S8> | ValidatorFunction<S8>,
		validator9: Validator<S9> | ValidatorFunction<S9>,
		validator10: Validator<S10> | ValidatorFunction<S10>
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10>;

	public static Or(
		...validators: Array<Validator<any> | ValidatorFunction<any>>
	): ValidatorFunction<any> {
		return (input: unknown) => {
			const errors = [];

			for (const validator of validators) {
				if (!validator) {
					continue;
				}

				if (validator instanceof Validator) {
					const result = validator.validate(input);
					if (!result) {
						errors.push(validator.getErrorString());
					}
				} else {
					const result = validator(input);
					if (!result.valid) {
						errors.push((result as ValidatorFail<any>).message);
					}
				}
			}

			return errors.length !== validators.length
				? {
						valid: true
				  }
				: {
						valid: false,
						message: errors.join('; ')
				  };
		};
	}

	public static And<S1>(validator1: Validator<S1> | ValidatorFunction<S1>): ValidatorFunction<S1>;
	public static And<S1, S2>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>
	): ValidatorFunction<S1 & S2>;
	public static And<S1, S2, S3>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>
	): ValidatorFunction<S1 & S2 & S3>;
	public static And<S1, S2, S3, S4>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>
	): ValidatorFunction<S1 & S2 & S3 & S4>;
	public static And<S1, S2, S3, S4, S5>(
		validator1: Validator<S1> | ValidatorFunction<S5>,
		validator2: Validator<S2> | ValidatorFunction<S5>,
		validator3: Validator<S3> | ValidatorFunction<S5>,
		validator4: Validator<S4> | ValidatorFunction<S5>,
		validator5: Validator<S5> | ValidatorFunction<S5>
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5>;
	public static And<S1, S2, S3, S4, S5, S6>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6>;
	public static And<S1, S2, S3, S4, S5, S6, S7>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7>;
	public static And<S1, S2, S3, S4, S5, S6, S7, S8>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>,
		validator8: Validator<S8> | ValidatorFunction<S8>
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8>;
	public static And<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>,
		validator8: Validator<S8> | ValidatorFunction<S8>,
		validator9: Validator<S9> | ValidatorFunction<S9>
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9>;
	public static And<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
		validator1: Validator<S1> | ValidatorFunction<S1>,
		validator2: Validator<S2> | ValidatorFunction<S2>,
		validator3: Validator<S3> | ValidatorFunction<S3>,
		validator4: Validator<S4> | ValidatorFunction<S4>,
		validator5: Validator<S5> | ValidatorFunction<S5>,
		validator6: Validator<S6> | ValidatorFunction<S6>,
		validator7: Validator<S7> | ValidatorFunction<S7>,
		validator8: Validator<S8> | ValidatorFunction<S8>,
		validator9: Validator<S9> | ValidatorFunction<S9>,
		validator10: Validator<S10> | ValidatorFunction<S10>
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9 & S10>;

	public static And(
		...validators: Array<Validator<any> | ValidatorFunction<any>>
	): ValidatorFunction<any> {
		return (input: unknown) => {
			const errors = [];

			for (const validator of validators) {
				if (validator instanceof Validator) {
					const result = validator.validate(input);
					if (!result) {
						errors.push(validator.getErrorString());
					}
				} else {
					const result = validator(input);
					if (!result.valid) {
						errors.push((result as ValidatorFail<any>).message);
					}
				}
			}

			return errors.length === 0
				? {
						valid: true
				  }
				: {
						valid: false,
						message: errors.join('; ')
				  };
		};
	}

	public static StrictValue = (value: any): ValidatorFunction<typeof value> => input =>
		input === value
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'does not equal ' + value
			  };

	public static OneOfStrict<S1>(validator1: S1): ValidatorFunction<S1>;
	public static OneOfStrict<S1, S2>(validator1: S1, validator2: S2): ValidatorFunction<S1 | S2>;
	public static OneOfStrict<S1, S2, S3>(
		validator1: S1,
		validator2: S2,
		validator3: S3
	): ValidatorFunction<S1 | S2 | S3>;
	public static OneOfStrict<S1, S2, S3, S4>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4
	): ValidatorFunction<S1 | S2 | S3 | S4>;
	public static OneOfStrict<S1, S2, S3, S4, S5>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7, S8>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
		validator8: S8
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
		validator8: S8,
		validator9: S9
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
		validator8: S8,
		validator9: S9,
		validator10: S10
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10>;
	public static OneOfStrict<T extends any>(...values: T[]): ValidatorFunction<T>;

	public static OneOfStrict<T extends any[]>(...values: T): ValidatorFunction<any> {
		// @ts-ignore
		return Validator.Or.apply(
			{},
			values.map(value => Validator.StrictValue(value))
		);
	}

	public static Values<T>(
		valueValidator: Validator<T> | ValidatorFunction<T>
	): ValidatorFunction<{ [key: string]: T }> {
		return (input: unknown) => {
			if (input === undefined || input === null) {
				return {
					valid: false,
					message: 'not defined'
				};
			}

			if (typeof input !== 'object') {
				return {
					valid: false,
					message: 'not an object'
				};
			}

			let good = true;
			const values = Object.values(input as any);

			for (const i of values) {
				if (valueValidator instanceof Validator) {
					if (!valueValidator.validate(i)) {
						good = false;
						break;
					}
				} else {
					if (!valueValidator(i).valid) {
						good = false;
						break;
					}
				}
			}

			return good
				? {
						valid: true
				  }
				: {
						valid: false,
						message: 'values in object do not match the required type'
				  };
		};
	}

	public static SimpleMultCheckboxReturn = new Validator<SimpleMultCheckboxReturn>({
		values: {
			validator: Validator.ArrayOf(Validator.Boolean)
		},
		labels: {
			validator: Validator.ArrayOf(Validator.String)
		}
	});

	public static OtherMultCheckboxReturn: ValidatorFunction<
		OtherMultCheckboxReturn
	> = Validator.Or(
		new Validator<MultCheckboxWithOtherSelected>({
			labels: {
				validator: Validator.ArrayOf(Validator.String)
			},
			otherSelected: {
				validator: Validator.StrictValue(true)
			},
			otherValue: {
				validator: Validator.String
			},
			values: {
				validator: Validator.ArrayOf(Validator.Boolean)
			}
		}),
		new Validator<MultCheckboxWithoutOtherSelected>({
			labels: {
				validator: Validator.ArrayOf(Validator.String)
			},
			otherSelected: {
				validator: Validator.StrictValue(false)
			},
			values: {
				validator: Validator.ArrayOf(Validator.Boolean)
			}
		})
	);

	public static OtherRadioReturn = <E extends number>(
		rrEnum: any
	): ValidatorFunction<RadioReturnWithOther<E>> =>
		Validator.Or(
			new Validator<RadioReturnWithOtherSelected>({
				labels: {
					validator: Validator.ArrayOf(Validator.String)
				},
				otherValue: {
					validator: Validator.String
				},
				otherValueSelected: {
					validator: Validator.StrictValue(true)
				}
			}),
			new Validator<RadioReturnWithoutOtherSelected<E>>({
				labels: {
					validator: Validator.ArrayOf(Validator.String)
				},
				otherValueSelected: {
					validator: Validator.StrictValue(false)
				},
				selection: {
					validator: Validator.Enum<E>(rrEnum)
				}
			})
		);

	public static MemberReference: ValidatorFunction<MemberReference> = input =>
		!Validator.Nothing(input).valid && isValidMemberReference(input)
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'not a valid member reference'
			  };

	private rules: ValidateRuleSet<T>;

	private errors: Array<ValidateError<T>> = [];

	public constructor(rules: ValidateRuleSet<T>) {
		this.rules = rules;

		this.transform = this.transform.bind(this);
		this.partialTransform = this.partialTransform.bind(this);
	}

	public validate(obj: any, partial?: false): obj is T;
	public validate(obj: any, partial: true): obj is Partial<T>;

	public validate(obj: any, partial: boolean = false) {
		this.errors = [];

		if (obj === undefined || obj === null) {
			return false;
		}

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				const value = obj[key];
				const rule = this.rules[key];

				if (value === null && rule.requiredIf) {
					if (rule.requiredIf(value, obj)) {
						this.errors.push({
							property: key,
							message: 'property is required'
						});
					}
					continue;
				}

				if (value === undefined) {
					if ((typeof rule.required === 'undefined' ? true : rule.required) && !partial) {
						if (rule.requiredIf) {
							if (rule.requiredIf(value, obj)) {
								this.errors.push({
									property: key,
									message: 'property is required'
								});
							}
						} else {
							this.errors.push({
								property: key,
								message: 'property is required'
							});
						}
					}
					continue;
				}

				if (rule.validator instanceof Validator) {
					if (!rule.validator.validate(value)) {
						this.errors.push({
							property: key,
							message: rule.validator.getErrorString()
						});
					}
				} else {
					const validateResult = rule.validator(value);

					if (!validateResult.valid) {
						this.errors.push({
							message: (validateResult as ValidatorFail<any>).message,
							property: key
						});
					}
				}
			}
		}

		return this.errors.length === 0;
	}

	public partialPrune<S extends Partial<T>>(obj: S, target?: T): Partial<T> {
		const newObject: Partial<T> = target || {};

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				if (obj[key] !== undefined) {
					const valid = this.rules[key].validator;
					if (valid instanceof Validator) {
						// @ts-ignore
						newObject[key] = valid.partialPrune(obj[key]);
					} else {
						const arr = obj[key];
						if (Array.isArray(arr)) {
							let validator: Validator<any>;
							// @ts-ignore
							validator = valid.validator;
							const newArray = [];
							if (validator instanceof Validator) {
								for (const i of arr) {
									newArray.push(validator.partialPrune(i));
								}
							} else {
								// TODO: Fix
								for (const i of arr) {
									newArray.push(i);
								}
							}
							// @ts-ignore
							newObject[key] = newArray;
						} else {
							// @ts-ignore
							newObject[key] = obj[key];
						}
					}
				}
			}
		}

		return newObject;
	}

	public prune<S extends T>(obj: S, target?: T): T {
		const newObject = target || ({} as T);

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				if (obj[key] === undefined || obj[key] === null) {
					// Standardize to null, as MySQLX doesn't like undefined
					// @ts-ignore
					newObject[key] = null;
					continue;
				}

				const valid = this.rules[key].validator;
				if (valid instanceof Validator) {
					newObject[key] = valid.prune(obj[key]);
				} else {
					const arr = obj[key];
					if (Array.isArray(arr)) {
						let validator: Validator<any>;
						// @ts-ignore
						validator = valid.validator;
						let newArray = [];
						if (validator instanceof Validator) {
							for (const i of arr) {
								newArray.push(validator.prune(i));
							}
						} else {
							newArray = arr;
						}
						// @ts-ignore
						newObject[key] = newArray;
					} else {
						newObject[key] = obj[key];
					}
				}
			}
		}

		return newObject;
	}

	public getErrors(): Array<ValidateError<T>> {
		return this.errors.slice();
	}

	public getErrorString(): string {
		return this.errors.map(err => `${err.property}: (${err.message})`).join('; ');
	}

	public expressValidator: express.RequestHandler = (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			res.end();
			return;
		}

		if (this.validate(req.body)) {
			req.body = this.prune(req.body);

			next();
		} else {
			res.status(400);
			res.json(this.getErrors());
		}
	};

	public leftyExpressHandler: express.RequestHandler = (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			return res.json(
				left({
					code: 400,
					error: 'Invalid body provided'
				})
			);
		}

		if (this.validate(req.body)) {
			req.body = this.prune(req.body);

			next();
		} else {
			res.status(400);
			res.json(
				left({
					code: 400,
					error: this.getErrors()
				})
			);
		}
	};

	public transform<R extends BasicAccountRequest>(
		req: R
	): AsyncEither<api.ServerError, Omit<R, 'body'> & { body: T }> {
		return asyncRight(req, serverErrorGenerator('Could not validate body'))
			.flatMap<R>(r =>
				r.body === undefined || r.body === null
					? asyncLeft({
							code: 400,
							error: none<Error>(),
							message: 'Invalid body provided'
					  })
					: asyncRight(r, serverErrorGenerator('Could not validate body'))
			)
			.flatMap(r =>
				this.validate(r.body)
					? asyncRight(
							{ ...r, body: this.prune(r.body) } as R &
								BasicSimpleValidatedRequest<T>,
							serverErrorGenerator('Could not validate body')
					  )
					: asyncLeft({ code: 400, error: none<Error>(), message: this.getErrorString() })
			);
	}

	public partialTransform<R extends BasicMemberRequest>(
		req: R
	): AsyncEither<
		api.ServerError,
		BasicMemberValidatedRequest<Partial<T>, R extends BasicMemberRequest<infer P> ? P : never>
	>;
	public partialTransform<R extends BasicConditionalMemberRequest>(
		req: R
	): AsyncEither<
		api.ServerError,
		BasicConditionalMemberValidatedRequest<
			Partial<T>,
			R extends BasicConditionalMemberRequest<infer P> ? P : never
		>
	>;
	public partialTransform<R extends BasicAccountRequest>(
		req: R
	): AsyncEither<
		api.ServerError,
		BasicSimpleValidatedRequest<Partial<T>, R extends BasicAccountRequest<infer P> ? P : never>
	>;

	public partialTransform<R extends BasicAccountRequest>(
		req: R
	): AsyncEither<api.ServerError, R & BasicSimpleValidatedRequest<Partial<T>>> {
		return asyncRight(req, serverErrorGenerator('Could not validate body'))
			.flatMap<R>(r =>
				r.body === undefined || r.body === null
					? asyncLeft({
							code: 400,
							error: none<Error>(),
							message: 'Invalid body provided'
					  })
					: asyncRight(r, serverErrorGenerator('Could not validate body'))
			)
			.flatMap(r =>
				this.validate(r.body, true)
					? asyncRight(
							{ ...r, body: this.partialPrune(r.body) } as R &
								BasicSimpleValidatedRequest<T>,
							serverErrorGenerator('Could not validate body')
					  )
					: asyncLeft({ code: 400, error: none<Error>(), message: this.getErrorString() })
			);
	}
}
