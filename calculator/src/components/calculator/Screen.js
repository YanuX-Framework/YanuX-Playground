
import './Screen.css';
import React from 'react';
import { Textfit } from 'react-textfit';

export default (props) => {
    if (props.componentsConfig && props.componentsConfig.screen) {
        return (
            <div className="screen">
                <Textfit
                    max={40}
                    throttle={60}
                    mode="single"
                    className="screen-top">
                    {props.expression}
                </Textfit>
                <Textfit
                    max={80}
                    mode="single"
                    className="screen-bottom">
                    {props.total}
                </Textfit>
            </div>)
    } else { return null }
}