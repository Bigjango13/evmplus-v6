import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App, { Head } from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import reducers from './reducers';
import { closeDialogue } from './actions/dialogue';

import './nhq.css';

const store = createStore(
	reducers,
	{
		BreadCrumbs : {
			links: []
		},
		SideNavigation : {
			links: []
		},
		Dialogue: {
			open: false,
			text: '',
			title: ''
		},
		SignedInUser: {
			valid: false
		}
	}
);

ReactDOM.render(
	<Provider store={store}>
		<Router>
			<App isMobile={false} />
		</Router>
	</Provider>,
	document.getElementById('root') as HTMLElement
);
document.onload = function () {
	ReactDOM.render(
		<Head />,
		document.getElementById('headelem') as HTMLElement
	);
};

registerServiceWorker();

window.addEventListener(
	'message',
	(event: MessageEvent): void => {
		if (event.data.source && event.data.source.indexOf('react-devtools') > -1) {
			return;
		}
		console.log(event);
		store.dispatch(closeDialogue());
	},
	false
);
