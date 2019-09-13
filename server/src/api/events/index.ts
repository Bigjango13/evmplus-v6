import * as express from 'express';
import {
	Account,
	conditionalMemberMiddleware,
	EventValidator,
	memberMiddleware,
	NewAttendanceRecordValidator,
	permissionMiddleware,
	replaceUndefinedWithNullMiddleware,
	Validator
} from '../../lib/internals';
import { tokenMiddleware } from '../formtoken';
// Attendance
import addattendance from './attendance/addattendance';
import addattendancebulk, { attendanceBulkValidator } from './attendance/addattendancebulk';
import deleteattendance from './attendance/deleteattendance';
import getattendance from './attendance/getattendance';
import modifyattendance from './attendance/modifyattendance';
// Debrief
import adddebrief from './debrief/adddebrief';
import deletedebrief from './debrief/deletedebrief';
// Event handlers
import addevent from './events/addevent';
import copy from './events/copy';
import deleteevent from './events/deleteevent';
import getevent from './events/getevent';
import getnextrecurring from './events/getnextrecurring';
import linkevent from './events/linkevent';
import list from './events/list';
import listupcoming from './events/listupcoming';
import setevent from './events/setevent';
import timelist from './events/timelist';
import attendancelog from './attendance/attendancelog';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', conditionalMemberMiddleware, list);
router.get('/upcoming', listupcoming);
router.get('/recurring', getnextrecurring);
router.get('/:start/:end', conditionalMemberMiddleware, timelist);
router.post(
	'/',
	memberMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(EventValidator),
	permissionMiddleware('ManageEvent'),
	addevent
);
router.post('/:parent', memberMiddleware, tokenMiddleware, linkevent);
router.delete('/:id', memberMiddleware, tokenMiddleware, deleteevent);
router.put(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	Validator.PartialBodyExpressMiddleware(EventValidator),
	setevent
);
router.get('/:id', memberMiddleware, getevent);
router.post('/:id/copy', memberMiddleware, tokenMiddleware, copy);



router.get('/:id/attendance', memberMiddleware, getattendance);

router.get('/:id/attendance/log', memberMiddleware, attendancelog);
router.post(
	'/:id/attendance/bulk',
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(attendanceBulkValidator),
	addattendancebulk
);
router.post(
	'/:id/attendance',
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(NewAttendanceRecordValidator),
	addattendance
);
router.put(
	'/:id/attendance',
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(NewAttendanceRecordValidator),
	modifyattendance
);
router.delete('/:id/attendance', memberMiddleware, tokenMiddleware, deleteattendance);

router.post('/:id/debrief', memberMiddleware, tokenMiddleware, adddebrief);
router.delete('/:id/debrief/:timestamp', memberMiddleware, tokenMiddleware, deletedebrief);

export default router;
