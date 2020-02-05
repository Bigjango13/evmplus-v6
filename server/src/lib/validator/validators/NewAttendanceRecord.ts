import { AttendanceStatus, NewAttendanceRecord } from 'common-lib';
import Validator from '../Validator';

export default class NewAttendanceRecordValidator extends Validator<NewAttendanceRecord> {
	constructor() {
		super({
			comments: {
				validator: Validator.String
			},
			planToUseCAPTransportation: {
				validator: Validator.Boolean
			},
			status: {
				validator: Validator.Enum(AttendanceStatus)
			},
			memberID: {
				required: false,
				validator: Validator.MemberReference
			},

			arrivalTime: {
				validator: Validator.Number,
				requiredIf: (value: number | null, obj: NewAttendanceRecord) => {
					return obj.departureTime !== null;
				}
			},
			departureTime: {
				validator: Validator.Number,
				requiredIf: (value: number | null, obj: NewAttendanceRecord) => {
					return obj.arrivalTime !== null;
				}
			}
		});
	}
}
