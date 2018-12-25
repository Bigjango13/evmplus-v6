import { ContentState, EditorState, RawDraftContentState } from 'draft-js';

let draft: typeof import('draft-js') | null = null;

interface Returns {
	state: EditorState;
	creator: typeof EditorState.createWithContent;
}

const queue: Array<(value: Returns) => void> = [];

import('draft-js').then(mod => {
	draft = mod;
	for (const i of queue) {
		i({
			state: mod.EditorState.createEmpty(),
			creator: mod.EditorState.createWithContent
		});
	}
});

// tslint:disable-next-line:no-empty-interface
interface MyEditorState extends EditorState {}

// tslint:disable-next-line:no-empty-interface
interface MyContentState extends ContentState {}

// tslint:disable-next-line:no-empty-interface
interface MyRawDraftContentState extends RawDraftContentState {}

export default (): Promise<Returns> => {
	if (draft !== null) {
		return Promise.resolve({
			state: draft.EditorState.createEmpty(),
			creator: draft.EditorState.createWithContent
		});
	} else {
		return new Promise<Returns>(res => {
			queue.push(res);
		});
	}
};

// Export only an interface so that we can use code splitting
export {
	MyEditorState as EditorState,
	MyContentState as ContentState,
	MyRawDraftContentState as RawDraftContentState
};
