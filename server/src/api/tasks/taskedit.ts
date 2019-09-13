import { NewTaskObject } from 'common-lib';
import { asyncErrorHandler, MemberValidatedRequest, Task } from '../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewTaskObject, { id: string }>, res) => {
		const id = parseInt(req.params.id, 10);

		if (id !== id) {
			res.status(400);
			res.end();
			return;
		}

		let task: Task;

		try {
			task = await Task.Get(id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		task.set(req.body);

		await task.save();

		res.status(204);
	}
);
