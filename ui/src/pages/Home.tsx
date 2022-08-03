import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Form from 'antd/es/form';

import { solve } from '../api/solve';
import { Answer } from '../api/Answer';
import { Query } from '../api/Query';

const { Option } = Select;
/**
 * This type defines the different values that will be accepted from the form's inputs.
 * The names of the keys (Eg. 'question', 'choices') must match
 * the HTML input's declared 'name' attribute.
 *
 * Eg:
 * ``` <Form.Item label="Question:" name="question"> ... </Form.Item>
 *
 * In this example, we aligned the
 * form's 'name' attributes with the keys of the 'Query' type that is used to query the API.
 */
type FormValue = Query;

export const Home = () => {
    const history = useHistory();
    const location = useLocation();
    /**
     * The home page has an Ant-D form, which requires the preservation of state in
     * memory. The links below contain more information about component state
     * and managed forms in React:
     *
     * @see https://reactjs.org/docs/state-and-lifecycle.html
     * @see https://ant.design/components/form/
     * @see https://reactjs.org/docs/forms.html
     *
     * Only use state when necessary, as in-memory representations add a bit of
     * complexity to your UI.
     */
    const [form] = Form.useForm<FormValue>();
    const [isFetchingAnswer, setIsFetchingAnswer] = useState(false);
    const [answer, setAnswer] = useState<Answer | undefined>();
    const [error, setError] = useState<string | undefined>();

    /**
     * This is a lifecycle function that's called by React after the component
     * has first been rendered and specifically when the 'location' data changes.
     *
     * You can read more about React component's lifecycle here:
     * @see https://reactjs.org/docs/state-and-lifecycle.html
     */
    useEffect(() => {
        fetchAnswer();
    }, [location]);

    /**
     * Submits a call to the API for a given query as defined in the URL parameters
     * @returns {void}
     */
    const fetchAnswer = () => {
        const query = Query.fromQueryString(location.search);

        // ensure that we have the expected parameters in the URL
        if (query.isValid()) {
            // remove empty question and answer options from the form so that the user knows they're not valid
            const cleanedQuery = new Query(
                query.question.trim(),
                query.choices.filter((choice) => choice.trim() !== '')
            );
            form.setFieldsValue(cleanedQuery);

            // reset answers and errors before we go fetch new results
            setError(undefined);
            setAnswer(undefined);
            setIsFetchingAnswer(true);

            // Note: validation is occurring on the backend, so errors will be thrown if there are any invalid inputs
            solve(query)
                .then((responseAnswer) => {
                    // When the API returns successfully update the answer
                    setError(undefined);
                    setAnswer(responseAnswer);
                })
                .catch((err) => {
                    // See if we can display as specific of an error as possible
                    let error;
                    if (err.response) {
                        // If the check below is true, the API returned
                        // error message that's likely helpful to display
                        if (err.response.data && err.response.data.error) {
                            error = err.response.data.error;
                        } else if (err.response.status === 503) {
                            error =
                                'Our system is a little overloaded, ' +
                                'please try again in a moment';
                        }
                    }

                    // Fallback to a general error message
                    if (!error) {
                        error = 'Something went wrong. Please try again.';
                    }
                    setAnswer(undefined);
                    setError(error);
                })
                .finally(() => {
                    setIsFetchingAnswer(false);
                });
        }
    };

    /**
     * This handler is invoked when the form is submitted, which occurs when
     * the user clicks the submit button or when the user clicks input while
     * the button and/or a form element is selected.
     *
     * We use this instead of a onClick button on a button as it matches the
     * traditional form experience that end users expect.
     *
     * @see https://reactjs.org/docs/forms.html
     */
    const handleSubmit = (values: FormValue) => {
        // We add the query params to the URL, so that users can link to
        // our demo and share noteworthy cases, edge cases, etc.
        const query = new Query(values.question, values.choices);
        // pushing this new URL will automatically trigger a new query (see the 'useEffect' function above)
        history.push(`/?${query.toQueryString()}`);
    };

    /**
     * The render method defines what's rendered. When writing yours keep in
     * mind that you should try to make it a "pure" function of the component's
     * props and state.  In other words, the rendered output should be expressed
     * as a function of the component properties and state.
     *
     * React executes render whenever a component's properties and/or state is
     * updated. The output is then compared with what's rendered and the
     * required updates are made. This is to ensure that rerenders make as few
     * changes to the document as possible -- which can be an expensive process
     * and lead to slow interfaces.
     */
    return (
        <React.Fragment>
            <h1>Example Demo</h1>
            <p>Enter a question and answers below to see what answer our application selects.</p>
            <FormWrapper
                layout="vertical"
                form={form}
                scrollToFirstError
                onFinish={(values) => handleSubmit(values as FormValue)}>
                <Form.Item label="Question:" name="question" rules={[{ required: true }]}>
                    <Input.TextArea
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        placeholder="Enter a question"
                    />
                </Form.Item>
                <Form.Item label="Answers:" name="choices" rules={[{ required: true }]}>
                    <Select
                        mode="tags"
                        placeholder="Select some possible answers from the list or enter a custom option."
                        showArrow>
                        {['Grapefruit', 'Lemon', 'Lime', 'Orange'].map((option) => (
                            <Option key={option} value={option}>
                                {option}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item>
                    {/* Warning: If you choose to remove this Button's 'loading' attribute, you will be responsible for
                        handling multiple asynchronous requests which could lead to inconsistencies. */}
                    <Button type="primary" htmlType="submit" loading={isFetchingAnswer}>
                        Submit
                    </Button>
                </Form.Item>
                {error && !answer ? (
                    <Alert type="error" message={error || 'Sorry, something went wrong.'} />
                ) : null}
                {!error && answer ? (
                    <Alert
                        type="info"
                        message="Our system answered:"
                        description={`${answer.answer} (${answer.score}%)`}
                    />
                ) : null}
            </FormWrapper>
        </React.Fragment>
    );
};

/**
 * The definition below creates a component that we can use in the render
 * function above that have extended / customized CSS attached to them.
 * Learn more about styled components:
 * @see https://www.styled-components.com/
 *
 *
 * CSS is used to modify the display of HTML elements. If you're not familiar
 * with it here's quick introduction:
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS
 */

const FormWrapper = styled(Form)`
    max-width: 600px;
`;
