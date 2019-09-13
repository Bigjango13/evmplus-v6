import { HTTPRequestMethod, ServerErrorObject } from 'common-lib';
import { parse } from 'error-stack-parser';
import { NextFunction, Response } from 'express';
import { ConditionalMemberRequest, generateResults, MemberBase } from '../../lib/internals';

// @ts-ignore
interface MaybeMemberRequest extends ConditionalMemberRequest {
	member?: MemberBase | null;
}

export default async (err: Error, req: MaybeMemberRequest, res: Response, next: NextFunction) => {
	if (!(err instanceof Error)) {
		return next();
	}

	// There was an error formatting the JSON properly
	if (err.message.startsWith('Unexpected token ')) {
		return next();
	}

	console.error(err);

	const errorCollection = req.mysqlx.getCollection<ServerErrorObject>('ServerErrors');
	let id = 0;

	// Create the ID of the new error
	{
		const errorGenerator = generateResults(errorCollection.find('true'));

		for await (const error of errorGenerator) {
			id = Math.max(id, error.id);
		}

		id++;
	}

	// Add the error to the database
	{
		const stacks = parse(err);

		const errorObject: ServerErrorObject = {
			id,

			requestedPath: req._originalUrl,
			requestedUser: req.member ? req.member.getReference() : null,
			requestMethod: req.method.toUpperCase() as HTTPRequestMethod,
			payload: JSON.stringify(req.body) || '<none>',
			accountID: req.account.id,

			message: err.message || '<none>',
			stack: stacks.map(stack => ({
				filename: stack.getFileName(),
				line: stack.getLineNumber(),
				column: stack.getColumnNumber(),
				name: stack.getFunctionName() || '<unknown>'
			})),
			filename: stacks[0].getFileName(),

			timestamp: Date.now(),
			resolved: false,
			type: 'Server'
		};

		await errorCollection.add(errorObject).execute();
	}

	// End the connection
	// Even though the error is handled, there is still an error and the
	// client shouldn't expect a result
	// However, to indicate that the error is recorded and may be fixed later
	// there is a non-standard header attached
	res.status(500);
	res.set('x-error-handled', 'true');
	res.end();
};
