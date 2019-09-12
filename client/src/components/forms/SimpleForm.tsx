import * as React from 'react';
import MemberSelector from '../dialogues/MemberSelector';
// Form inputs
import BigTextBox from '../form-inputs/BigTextBox';
import Checkbox from '../form-inputs/Checkbox';
import DateTimeInput from '../form-inputs/DateTimeInput';
import DisabledMappedText from '../form-inputs/DisabledMappedText';
import DisabledText from '../form-inputs/DisabledText';
import FileInput from '../form-inputs/FileInput';
import FormBlock from '../form-inputs/FormBlock';
import { InputProps } from '../form-inputs/Input';
import ListEditor from '../form-inputs/ListEditor';
import LoadingTextArea from '../form-inputs/LoadingTextArea';
import MultCheckbox from '../form-inputs/MultCheckbox';
import MultiRange from '../form-inputs/MultiRange';
import NumberInput from '../form-inputs/NumberInput';
import POCInput from '../form-inputs/POCInput';
import RadioButton from '../form-inputs/RadioButton';
import Selector from '../form-inputs/Selector';
import SimpleRadioButton from '../form-inputs/SimpleRadioButton';
import TeamMemberInput from '../form-inputs/TeamMemberInput';
import TeamSelector from '../form-inputs/TeamSelector';
import TextBox from '../form-inputs/TextBox';
import TextInput from '../form-inputs/TextInput';
import Select from '../form-inputs/Select';

let TextArea: typeof import('../form-inputs/TextArea').default;

import('../form-inputs/TextArea').then(textArea => {
	TextArea = textArea.default;
});

const saveMessage = {
	marginLeft: 10
};

/**
 * Creates a label to be used in the form
 */
class Label extends React.Component<{
	fullWidth?: boolean;
	style?: React.CSSProperties;
	id?: string;
}> {
	public readonly IsLabel = true;

	constructor(props: { fullWidth: boolean; style?: React.CSSProperties; id: string }) {
		super(props);

		this.IsLabel = true;
	}

	public render() {
		return (
			<div className="formbox" style={this.props.style} id={this.props.id}>
				{this.props.children}
			</div>
		);
	}
}

class Divider extends React.Component {
	public render() {
		return <div className="divider" />;
	}
}

const fullWidth = {
	width: '100%'
};

/**
 * Creates a title to use in the form
 */
class Title extends React.Component<{ fullWidth?: boolean; id?: string }> {
	public readonly IsLabel = true;

	constructor(props: { fullWidth: boolean; id: string }) {
		super(props);

		this.IsLabel = true;
	}

	public render() {
		const id =
			this.props.id || typeof this.props.children === 'string'
				? this.props
						.children!.toString()
						.toLocaleLowerCase()
						.replace(/ +/g, '-')
				: '';

		return (
			<div className="formbar fheader" style={fullWidth}>
				<div className="formbox header" style={fullWidth}>
					<h3 id={id}>{this.props.children}</h3>
				</div>
			</div>
		);
	}
}

/**
 * Helper function
 *
 * @param el
 */
export function isInput(
	el: React.ReactChild | React.ReactElement<any> | boolean
): el is React.ReactElement<InputProps<any>> {
	if (typeof el !== 'object' || el === null) {
		return false;
	}
	return (
		el.type === TextInput ||
		el.type === TextArea ||
		el.type === MultiRange ||
		el.type === DateTimeInput ||
		el.type === RadioButton ||
		el.type === MultCheckbox ||
		el.type === Checkbox ||
		el.type === ListEditor ||
		el.type === FormBlock ||
		el.type === SimpleRadioButton ||
		el.type === TextBox ||
		el.type === NumberInput ||
		el.type === Selector ||
		el.type === LoadingTextArea ||
		el.type === BigTextBox ||
		el.type === DisabledMappedText ||
		el.type === DisabledText ||
		el.type === TeamSelector ||
		el.type === MemberSelector ||
		el.type === TeamMemberInput ||
		el.type === POCInput ||
		el.type === Select ||
		// @ts-ignore
		el.type === FileInput
	);
}

export const isFullWidthableElement = (
	el:
		| React.ReactElement<InputProps<any>>
		| React.ReactElement<InputProps<any> & { fullWidth: boolean }>
): el is React.ReactElement<InputProps<any> & { fullWidth: boolean }> =>
	// @ts-ignore
	typeof el.props.fullWidth !== 'undefined';

/**
 * Similar helper function
 *
 * @param el
 */
export function isLabel(el: React.ReactChild): el is React.ReactElement<any> {
	if (typeof el === 'string' || typeof el === 'number' || el === null) {
		return false;
	}
	return el.type === Title || el.type === Label || el.type === Divider;
}

/**
 * Helper type used to represent the tracking of errors and changed fields
 */
export type BooleanFields<T> = { [K in keyof T]: boolean };

export type FormValidator<T> = { [K in keyof T]?: (value: T[K], allValues: T) => boolean };

/**
 * The properties a form itself requires
 */
export interface FormProps<F> {
	/**
	 * The function that is called when the user submits the form
	 *
	 * @param fields The fields of the form
	 */
	onSubmit?: (
		fields: F,
		error: BooleanFields<F>,
		changed: BooleanFields<F>,
		hasError: boolean
	) => void;
	/**
	 * Styles the submit button
	 */
	submitInfo?: {
		/**
		 * The text for the submit button to use
		 */
		text: string;
		/**
		 * A CSS class to use
		 */
		className?: string;
		/**
		 * Whether or not the button is to be disabled
		 */
		disabled?: boolean;
	};
	/**
	 * The ID to identify the form with CSS
	 *
	 * Also used to 'save' the form; make it long so that it is unique!
	 *
	 * @deprecated Never implemented nor will ever be used
	 */
	id?: string;
	/**
	 * Determines whether or not to load a previously saved form
	 *
	 * @param saveTime How long ago was the form saved
	 * @param fields The fields to look at
	 *
	 * @returns Whether or not to load a previous save
	 *
	 * @deprecated Never implemented nor will ever be used
	 */
	shouldLoadPreviousFields?: (saveTime: number, fields: F) => boolean;
	/**
	 * Replaces the previous property
	 *
	 * Basically makes it so it uses a function that checks whether or not saveTime
	 * is less than the value specified
	 */
	saveCheckTime?: number;
	/**
	 * What to do on a form value changing
	 *
	 * Can be used to help with checking if a form field should be disabled
	 */
	onChange?: (
		fields: F,
		error: BooleanFields<F>,
		changed: BooleanFields<F>,
		hasError: boolean,
		fieldChanged: keyof F
	) => void;
	/**
	 * Sets the values given the name. Allows for not having to set form values repeatedly
	 */
	values?: F;
	/**
	 * Whether or not to show a submit button. This is nice for when a submit button is not
	 * nessecary
	 */
	showSubmitButton?: boolean;
	/**
	 * Validator for the form
	 */
	validator?: FormValidator<F>;
	/**
	 * Submit message
	 *
	 * If the value is false, it doesn't dipslay anything
	 * This allows for stuff like this:
	 *
	 * successMessage={this.state.shouldDisplaySubmit && 'Saved!'}
	 *
	 * or
	 *
	 * successMessage={this.state.shouldDisplaySaved ? 'Saved' : this.state.shouldDisplayError && 'Failed'}
	 */
	successMessage?: false | string;
}

/**
 * The form itself
 *
 * To use with type checking in the submit function, you can do something similar to the following:
 * @example
 * type SampleForm = new () => Form<{x: string}>
 * let SampleForm = Form as SampleForm // Sometimes `as any as Sampleform`
 * // <SampleForm /> now works as Form<{x: string}>
 * <Form<{x: string}> />
 * // With TypeScript 2.8 Generics work with React components
 */
class SimpleForm<C extends {} = {}, P extends FormProps<C> = FormProps<C>> extends React.Component<
	P,
	{
		disabled: boolean;
	}
> {
	protected fields: C = {} as C;
	protected fieldsChanged: { [K in keyof C]: boolean } = {} as { [K in keyof C]: boolean };
	protected fieldsError: { [K in keyof C]: boolean } = {} as { [K in keyof C]: boolean };
	protected hasError: boolean = false;

	protected token: string = '';
	protected sessionID: string = '';

	/**
	 * Create a form
	 *
	 * ID is required
	 * SubmitInfo describes the submit button
	 * onSubmit is the callback to use when the form is submitted
	 *
	 * @param {P} props The properties
	 */
	constructor(props: P) {
		super(props);

		this.state = {
			disabled: false
		};

		this.onChange = this.onChange.bind(this);
		this.onInitialize = this.onInitialize.bind(this);
		this.submit = this.submit.bind(this);

		this.fields = {} as C;
	}

	/**
	 * Render function for a React Component
	 *
	 * @returns {JSX.Element} A form
	 */
	public render(): JSX.Element {
		const submitInfo = {
			text: 'Submit',
			className: 'submit',
			disabled: this.hasError,
			...(this.props.submitInfo || {})
		};

		return (
			<form onSubmit={this.submit} className="asyncForm">
				{React.Children.map(this.props.children, (child: React.ReactChild, i) => {
					if (
						typeof this.props.children === 'undefined' ||
						this.props.children === null
					) {
						throw new TypeError('Some error occurred');
					}
					let ret;
					let fullWidth = false;
					if (!isInput(child)) {
						// This algorithm handles labels for inputs by handling inputs
						// Puts out titles on their own line
						// Disregards spare labels and such
						if (isLabel(child) && (child.type === Title || child.type === Divider)) {
							return child;
						}
						return;
					} else {
						const childName: keyof C = child.props.name as keyof C;
						const value =
							typeof child.props.value !== 'undefined'
								? child.props.value
								: typeof this.props.values === 'undefined'
								? ''
								: typeof (this.props.values as C)[childName] === 'undefined'
								? ''
								: (this.props.values as C)[childName];

						// typeof this.props.values !== 'undefined'
						// 	? typeof this.props.values[
						// 			child.props.name
						// 	  ] === 'undefined'
						// 		? typeof child.props.value ===
						// 		  'undefined'
						// 			? ''
						// 			: child.props.value
						// 		: this.props.values[child.props.name]
						// 	: typeof child.props.value === 'undefined'
						// 	? ''
						// 	: child.props.value;
						if (typeof this.fields[childName] === 'undefined') {
							this.fields[childName] = value;
						}
						if (isFullWidthableElement(child)) {
							fullWidth = child.props.fullWidth;
						}
						if (typeof fullWidth === 'undefined') {
							fullWidth = false;
						}
						if (child.type === FormBlock) {
							fullWidth = true;
						}

						ret = [
							React.cloneElement(child, {
								onUpdate: this.onChange,
								onInitialize: this.onInitialize,
								key: i + 1,
								value,
								hasError: this.fieldsError[childName]
							})
						];
					}
					if (!fullWidth) {
						if (
							i > 0 &&
							typeof (this.props.children as React.ReactChild[])[i - 1] !==
								'undefined' &&
							(this.props.children as React.ReactChild[])[i - 1] !== null &&
							!isInput((this.props.children as React.ReactChild[])[i - 1])
						) {
							const children = this.props.children;
							if (
								typeof children === 'string' ||
								typeof children === 'number' ||
								typeof children === 'boolean'
							) {
								return;
							}

							if (!Array.isArray(children)) {
								return;
							}

							const previousChild = children[i - 1];

							if (
								typeof previousChild === 'string' ||
								typeof previousChild === 'number' ||
								typeof previousChild === 'undefined' ||
								previousChild === null
							) {
								ret.unshift(
									<Label key={i - 1} fullWidth={fullWidth}>
										{previousChild}
									</Label>
								);
							} else {
								// @ts-ignore
								if (isLabel(previousChild!) && previousChild!.type !== Title) {
									ret.unshift(
										// @ts-ignore
										React.cloneElement(previousChild, {
											onUpdate: this.onChange,
											onInitialize: this.onInitialize,
											key: i
										})
									);
								}
							}
						} else {
							ret.unshift(
								<div
									className="formbox"
									style={{
										height: 2
									}}
									key={i - 1}
								/>
							);
						}
					}

					return (
						<div key={i} className={`formbar${fullWidth ? ' fullwidth' : ''}`}>
							{ret}
						</div>
					);
				})}
				{(typeof this.props.showSubmitButton === 'undefined' ? (
					true
				) : (
					this.props.showSubmitButton
				)) ? (
					<div className="formbar">
						<div
							className="formbox"
							style={{
								height: '2px'
							}}
						/>
						<div className="formbox">
							<input
								type="submit"
								value={submitInfo.text}
								className={submitInfo.className}
								disabled={this.state.disabled || submitInfo.disabled}
							/>
							{this.props.successMessage && (
								<span style={saveMessage}>{this.props.successMessage}</span>
							)}
						</div>
					</div>
				) : null}
				<div
					style={{
						overflow: 'auto',
						clear: 'both',
						height: 1
					}}
				/>
			</form>
		);
	}

	/**
	 * What is used to describe when a form element changes
	 */
	protected onChange(e: { name: string; value: any }) {
		const name = e.name as keyof C;
		this.fields[name] = e.value;
		this.fieldsChanged[e.name as keyof C] = true;

		let error = false;
		const validator = this.props.validator ? this.props.validator[name] : null;
		if (validator) {
			error = validator(e.value, this.fields);
		}
		this.fieldsError[e.name as keyof C] = error;

		let hasError = false;
		for (const i in this.fieldsError) {
			if (this.fieldsError.hasOwnProperty(i)) {
				hasError = this.fieldsError[i];
				if (hasError) {
					break;
				}
			}
		}

		// DO NOT TOUCH
		// If this is moved into the conditional TypeScript gets upset
		const onChange = this.props.onChange;

		if (onChange !== undefined) {
			onChange(this.fields, this.fieldsError, this.fieldsChanged, hasError, name);
		}
	}

	protected onInitialize(e: { name: string; value: any }) {
		const name = e.name as keyof C;
		this.fields[name] = e.value;
		this.fieldsChanged[e.name as keyof C] = false;

		let error = false;
		const validator = this.props.validator ? this.props.validator[name] : null;
		if (validator) {
			error = validator(e.value, this.fields);
		}
		this.fieldsError[e.name as keyof C] = error;

		let hasError = false;
		for (const i in this.fieldsError) {
			if (this.fieldsError.hasOwnProperty(i)) {
				hasError = this.fieldsError[i];
				if (hasError) {
					break;
				}
			}
		}

		// DO NOT TOUCH
		// If this is moved into the conditional TypeScript gets upset
		const onChange = this.props.onChange;

		if (onChange !== undefined) {
			onChange(this.fields, this.fieldsError, this.fieldsChanged, hasError, name);
		}
	}

	/**
	 * Function called when the form is submitted
	 *
	 * @param {React.FormEvent<HTMLFormEvent>} e Event
	 */
	protected submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (typeof this.props.onSubmit !== 'undefined') {
			let hasError = false;
			for (const i in this.fieldsError) {
				if (this.fieldsError.hasOwnProperty(i)) {
					hasError = this.fieldsError[i];
					if (hasError) {
						break;
					}
				}
			}

			this.props.onSubmit(this.fields, this.fieldsError, this.fieldsChanged, hasError);
		}
	}
}

export default SimpleForm;

export {
	Title,
	Label,
	Divider,
	FileInput,
	MultiRange,
	TextInput,
	DateTimeInput,
	RadioButton,
	MultCheckbox,
	Checkbox,
	ListEditor,
	FormBlock,
	SimpleRadioButton,
	TextBox,
	NumberInput,
	Selector,
	LoadingTextArea,
	DisabledMappedText,
	BigTextBox,
	DisabledText,
	TeamSelector,
	MemberSelector,
	TeamMemberInput
};
