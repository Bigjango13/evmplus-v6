import * as React from 'react';
import { InputProps } from './Input';

export interface SimpleRadioProps<E extends number = number> extends InputProps<E | -1> {
	labels: string[];
	other?: boolean;
}

export default class SimpleRadioButton<E extends number = number> extends React.Component<
	SimpleRadioProps<E | -1>
> {
	constructor(props: SimpleRadioProps<E | -1>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value === undefined ? -1 : this.props.value
			});
		}
	}

	public render() {
		const index = typeof this.props.index === 'undefined' ? '' : '-' + this.props.index;

		return (
			<div className="formbox" style={this.props.boxStyles}>
				<section className="radioDiv">
					{this.props.labels.map((label, i) => {
						const checked = i === this.props.value;
						return (
							<div className="roundedTwo" key={i}>
								<input
									id={`${this.props.name}-${i}${index}`}
									type="radio"
									value={i}
									onChange={this.getChangeHandler(i)}
									checked={checked}
								/>
								<label htmlFor={`${this.props.name}-${i}${index}`}>{label}</label>
								<label
									htmlFor={`${this.props.name}-${i}${index}`}
									className="check"
								/>
							</div>
						);
					})}
				</section>
			</div>
		);
	}

	private getChangeHandler(index: number) {
		return () => {
			if (this.props.onChange) {
				this.props.onChange(index as E);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: index as E
				});
			}
		};
	}
}
