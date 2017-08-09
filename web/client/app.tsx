import * as React from 'react';
import {render} from 'react-dom';
import {BrowserRouter, Switch, Route, RouteComponentProps} from 'react-router-dom';

import {IWeb3Window, getContracts} from './chain';
declare const window: IWeb3Window;

import HomePage from './home-page';

window.addEventListener('load', async () => {
    await getContracts();
    render(
        <BrowserRouter children={
            <div>
                <Switch>
                    <Route path="/" component={HomePage} />
                </Switch>
            </div>
        } />,
        document.getElementById('site-outlet')
    );
});
