import * as React from 'react';

import './DateTimeInput.css';

import { InputProps } from './Input';

import { DateTime } from 'luxon';

const TimeZoneDisplays = {
	'America/New_York': 'EST',
	'America/Chicago': 'CST',
	'America/Denver': 'MST',
	'America/Los_Angeles': 'PST',
	'America/Arizona': 'Arizona',
	'America/Anchorage': 'Alaska',
	'Pacific/Hawaii': 'Hawaii'
};

type SupportedTimeZones = keyof typeof TimeZoneDisplays;

// We don't want it to throw an error with value being a moment or a number
// @ts-ignore
export interface DateTimeInputProps extends InputProps<number> {
	value?: DateTime | number;
	date: boolean;
	time: boolean;
	minuteInterval?: number;
	originalTimeZoneOffset: SupportedTimeZones;
}

// @ts-ignore
export interface TimeInputProps extends DateTimeInputProps {
	value: DateTime | number; // Make it required to specify day
	date: false;
	time: true;
}

// @ts-ignore
export interface DateInputProps extends DateTimeInputProps {
	date: true;
	time: false;
}

export const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

interface DateTimeState {
	guiOpen: boolean;
	guiCurrentMonth: number;
	guiCurrentYear: number;
	focused: boolean;
}

const getMonth = (month: number, year: number) =>
	DateTime.utc()
		.set({
			year,
			month
		})
		.startOf('month');

const normalizeInput = (
	value: number | DateTime | undefined,
	offset: SupportedTimeZones
) =>
	typeof value !== 'undefined'
		? typeof value === 'number'
			? DateTime.fromMillis(value * 1000, {
					zone: offset
			  })
			: value
		: DateTime.utc();

const FIVE_MINUTES = 5 * 60 * 1000;

const roundInput = (
	input: DateTime,
	interval: number,
	offset: SupportedTimeZones
) =>
	DateTime.fromMillis(Math.round(+input / interval) * interval, {
		zone: offset
	});

export default class DateTimeInput extends React.Component<
	DateTimeInputProps | TimeInputProps | DateInputProps,
	DateTimeState
> {
	constructor(props: DateTimeInputProps | TimeInputProps | DateInputProps) {
		super(props);

		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: Math.round(+start / 1000)
			});
		}

		this.state = {
			guiOpen: false,
			guiCurrentMonth: start.month,
			guiCurrentYear: start.year,
			focused: false
		};

		this.updateDateDay = this.updateDateDay.bind(this);
		this.updateDateMonth = this.updateDateMonth.bind(this);
		this.updateDateYear = this.updateDateYear.bind(this);

		this.updateTimeMinutes = this.updateTimeMinutes.bind(this);
		this.updateTimeHours = this.updateTimeHours.bind(this);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);

		this.onMinuteBlur = this.onMinuteBlur.bind(this);
		this.onYearBlur = this.onYearBlur.bind(this);

		this.openGui = this.openGui.bind(this);
		this.closeGui = this.closeGui.bind(this);
	}

	public render() {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		const sameTimezone =
			DateTime.local().offset === start.offset;

		const className =
			(this.props.date ? 'date' : '') + (this.props.time ? 'time' : '');

		return (
			<div className="formbox" style={this.props.boxStyles}>
				<div
					className={`${className}-input-box 
						datetime-input-root
						${this.state.focused ? ' focused' : ''}
						${this.state.guiOpen ? ' gui-open' : ''}`}
				>
					<div>
						{this.props.date ? (
							<>
								<input
									className="date-input-year"
									placeholder="----"
									value={start.year}
									onChange={this.updateDateYear}
									onFocus={this.onFocus}
									onBlur={() => {
										this.onBlur();
										this.onYearBlur();
									}}
								/>
								<span className="datetime-input-seperator">
									/
								</span>
								<input
									className="date-input-month"
									placeholder="--"
									value={start.month}
									onChange={this.updateDateMonth}
									onFocus={this.onFocus}
									onBlur={this.onBlur}
								/>
								<span className="datetime-input-seperator">
									/
								</span>
								<input
									className="date-input-day"
									placeholder="--"
									value={start.day}
									onChange={this.updateDateDay}
									onFocus={this.onFocus}
									onBlur={this.onBlur}
								/>
							</>
						) : null}
						{this.props.date && this.props.time ? (
							<span className="datetime-input-seperator">
								&nbsp;
							</span>
						) : null}
						{this.props.time ? (
							<>
								<input
									className="time-input-hour"
									placeholder="--"
									value={start.hour}
									onChange={this.updateTimeHours}
									onFocus={this.onFocus}
									onBlur={this.onBlur}
								/>
								<span className="datetime-input-seperator">
									:
								</span>
								<input
									className="time-input-minute"
									placeholder="--"
									value={start.minute}
									onChange={this.updateTimeMinutes}
									onFocus={this.onFocus}
									onBlur={() => {
										this.onBlur();
										this.onMinuteBlur();
									}}
								/>
							</>
						) : null}
						{this.props.date ? (
							<button
								className="date-input-opendialogue"
								onFocus={this.onFocus}
								onBlur={this.onBlur}
								onClick={this.openGui}
							/>
						) : null}
						{this.props.time ? (
							<button
								className="time-input-opendialogue"
								onFocus={this.onFocus}
								onBlur={this.onBlur}
								onClick={this.openGui}
							/>
						) : null}
					</div>
					{!sameTimezone ? (
						<>
							<br />
							<div className="original-time">
								Time displayed in{' '}
								{
									TimeZoneDisplays[
										this.props.originalTimeZoneOffset
									]
								}
							</div>
						</>
					) : null}
					{this.state.guiOpen ? this.renderCalendar() : null}
				</div>
			</div>
		);
	}

	private updateDateYear(e: React.ChangeEvent<HTMLInputElement>) {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		if (e.target.value === '') {
			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: +(start.set({ year: 0 }))
				})
			}
			return;
		}

		const test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test > 9999 || test < 0) {
			this.forceUpdate();
			return;
		}

		const newInput = start.set({
			year: test
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private updateDateMonth(e: React.ChangeEvent<HTMLInputElement>) {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		if (e.target.value === '') {
			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: +(start.set({ year: 0 }))
				})
			}
			return;
		}

		const test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test > 12 || test < 1) {
			this.forceUpdate();
			return;
		}

		let newInput = start.set({
			month: test
		});

		if (newInput.daysInMonth < start.day) {
			newInput = newInput.set({
				day: newInput.daysInMonth
			});
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private updateDateDay(e: React.ChangeEvent<HTMLInputElement>) {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		if (e.target.value === '') {
			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: +(start.set({ year: 0 }))
				})
			}
			return;
		}

		const currentInput = start;
		const test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test > currentInput.daysInMonth || test < 1) {
			this.forceUpdate();
			return;
		}

		const newInput = currentInput.set({
			day: test
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private updateTimeHours(e: React.ChangeEvent<HTMLInputElement>) {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		if (e.target.value === '') {
			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: +(start.set({ year: 0 }))
				})
			}
			return;
		}

		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test === 24) {
			test = 0;
		}

		if (test > 23 || test < 0) {
			this.forceUpdate();
			return;
		}

		const newInput = start.set({
			hour: test
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private updateTimeMinutes(e: React.ChangeEvent<HTMLInputElement>) {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		if (e.target.value === '') {
			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: +(start.set({ year: 0 }))
				})
			}
			return;
		}

		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test < 0 || test > 59) {
			this.forceUpdate();
			return;
		}

		if (test >= 10) {
			test = Math.round(test / 5) * 5;
		}

		const newInput = start.set({
			minute: test
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private onFocus() {
		this.setState({
			focused: true
		});
	}

	private onBlur() {
		this.setState({
			focused: false
		});
	}

	private onMinuteBlur() {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		const test = start.minute;

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test < 0 || test > 59) {
			this.forceUpdate();
			return;
		}

		const newInput = start.set({
			minute: test
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private onYearBlur() {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		let test = start.year;

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test >= 0 && test < 100) {
			if (test >= DateTime.local().plus({ years: 2 }).year) {
				test = 1900 + test;
			} else {
				test = 2000 + test;
			}
		}

		const newInput = start.set({
			year: test
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: Math.round(+newInput / 1000)
			});
		}
	}

	private openGui() {
		this.setState({
			guiOpen: true
		});
	}

	private closeGui() {
		this.setState({
			guiOpen: false
		});
	}

	private renderCalendar() {
		const className =
			(this.props.date ? 'date' : '') + (this.props.time ? 'time' : '');

		const year = this.state.guiCurrentYear;
		const month = this.state.guiCurrentMonth;

		const lastMonth = getMonth(month - 1, year).endOf('month');
		const thisMonth = getMonth(month, year);
		const nextMonth = getMonth(month + 1, year);

		const firstDay = thisMonth.weekday % 7;

		const numberWeeks =
			Math.ceil((thisMonth.daysInMonth + (thisMonth.weekday % 7)) / 7) +
			1;

		const calendar: Array<
			Array<{
				day: number;
				month: number;
				year: number;
			}>
		> = [];

		const startOfLastMonthWeek = lastMonth.startOf('week');
		let j;
		let i;

		calendar[0] = [];
		for (i = 0; i < firstDay; i++) {
			calendar[0][i] = {
				day: startOfLastMonthWeek.day + i,
				month: lastMonth.month,
				year: lastMonth.year
			};
		}

		for (i = firstDay; i < 7; i++) {
			calendar[0][i] = {
				day: i - firstDay + 1,
				month: thisMonth.month,
				year: thisMonth.year
			};
		}

		let start: number;

		for (i = 1; i < numberWeeks - 2; i++) {
			start = calendar[i - 1][6].day + 1;
			calendar[i] = [];
			for (j = 0; j < 7; j++) {
				calendar[i][j] = {
					day: start + j,
					month: thisMonth.get('month'),
					year: thisMonth.get('year')
				};
			}
		}

		start = calendar[calendar.length - 1][6].day + 1;
		calendar[calendar.length] = [];
		for (i = start, j = 0; i <= thisMonth.daysInMonth; i++, j++) {
			calendar[calendar.length - 1][j] = {
				day: i,
				month: thisMonth.get('month'),
				year: thisMonth.get('year')
			};
		}

		if (j !== 7) {
			for (i = 1; j < 7; i++, j++) {
				calendar[calendar.length - 1][j] = {
					day: i,
					month: nextMonth.get('month'),
					year: nextMonth.get('year')
				};
			}
		}

		return (
			<div
				className={`${className}-input-gui-box datetime-input-gui-root`}
			>
				<div className="datetime-gui-parent">
					<div className="date-picker">
						<table>
							<caption>
								{this.state.guiCurrentYear}{' '}
								{MONTHS[this.state.guiCurrentMonth]}
							</caption>
							<tbody>
								{calendar.map(row => (
									<tr>
										{row.map(item => (
											<td
												className={
													item.month ===
													thisMonth.get('month')
														? 'datetime-gui-inmonth'
														: 'datetime-gui-outmonth'
												}
											>
												{item.day}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="time-picker">2</div>
				</div>
			</div>
		);
	}
}
