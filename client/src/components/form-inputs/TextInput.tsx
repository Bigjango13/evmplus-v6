import * as React from 'react';

import { InputProps } from './Input';

interface TextInputProps extends InputProps<string> {
	/**
	 * Called when the file is changed
	 * 
	 * If it returns a boolean, it changes whether or not the change is accepted
	 */
	onChange?: (val: string) => boolean | void;
	fullWidth?: boolean;
	placeholder?: string;
}

/**
 * A text input that can be used by a Form
 */
export default class TextInput extends React.Component<TextInputProps, {
	value: string
}> {
	public state = {
		value: ''
	};
	
	constructor(props: TextInputProps) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.value) {
			this.state = {
				value: props.value
			};
		}
	}

	public onChange (e: React.FormEvent<HTMLInputElement>) {
		const text = e.currentTarget.value;

		let change = true;

		if (typeof this.props.onChange !== 'undefined') {
			const newChange = this.props.onChange(text);
			if (typeof newChange === 'boolean') {
				change = newChange;
			}
		}

		if (change) {
			if (typeof this.props.onUpdate !== 'undefined') {
				this.props.onUpdate({
					name: this.props.name,
					value: text
				});
			}
		}
	}

	public render() {
		return (
			<div
				className="formbox"
				style={{
					clear: this.props.fullWidth ? 'both' : undefined,
					width: this.props.fullWidth ? '90%' : undefined,
					...this.props.boxStyles
				}}
			>
				<input
					type="text"
					value={this.props.value}
					onChange={this.onChange}
					name={this.props.name}
					style={{
						width: this.props.fullWidth ? '100%' : undefined,
						...this.props.inputStyles
					}}
					placeholder={this.props.placeholder}
				/>
			</div>
		);
	}
}