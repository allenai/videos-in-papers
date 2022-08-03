/**
 * This file is meant for shared display components that you use throughout
 * your application.
 *
 * Components with a lot of logic, or those that are particularly complicated
 * should probably be put in their own file. This file is meant for the
 * re-usable, simple things used in a lot of different spots in your UI.
 */
import React, { useEffect } from 'react';
import styled from 'styled-components';
import WarningOutlined from '@ant-design/icons/lib/icons/WarningOutlined';
import { RouteComponentProps, withRouter } from 'react-router-dom';

export const Error = ({ message }: { message: string }) => (
    <ErrorGrid>
        <WarningOutlined />
        {message}
    </ErrorGrid>
);

const TwoColumnGrid = styled.div`
    display: grid;
    grid-template-columns: auto max-content;
    grid-gap: ${({ theme }) => `${theme.spacing.xs}`};
    align-items: center;
`;

const ErrorGrid = styled(TwoColumnGrid)`
    color: ${({ theme }) => theme.palette.text.error.hex};
`;

/**
 * Copied in form VArnish until varnish fixes itself: allenai/varnish#543
 *
 * Use this component inside a top-level <Route /> handler when you'd like
 * the page to be scrolled to the top after a URL change.
 */
const ScrollToTopOnPageChangeImpl = ({ history }: RouteComponentProps) => {
    useEffect(() =>
        history.listen(() => {
            window.scrollTo(0, 0);
        })
    );
    return null;
};

export const ScrollToTopOnPageChange = withRouter(ScrollToTopOnPageChangeImpl);
