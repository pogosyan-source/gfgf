(function (d, w) {
    window.PRODUCT_ID = w.PRODUCT_ID || 38;
    window.METHOD_ID = w.METHOD_ID || 185;
    window.API_HOST = w.API_HOST || 'https://app.cherryx.ai';
    window.REDIRECT_HOST = w.REDIRECT_HOST || 'https://cherryx.ai';

    const request = (url, method = 'GET', jsonBody = null, headers = null) => {
        return fetch(url, {
            credentials: 'same-origin',
            method: method,
            body: JSON.stringify(jsonBody),
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            }
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data?.result) {
                    return Promise.reject(data);
                } else {
                    return data;
                }
            });
    };

    function showError(message) {
        const errorsContainer = d.querySelector('.form__item--messages');
        if (errorsContainer) {
            errorsContainer.innerHTML = `<div class="form__error">${message}</div>`;
            errorsContainer.style.display = 'block';
        } else {
            console.error(message);
        }
    }

    function signup(props) {
        return request(w.API_HOST + '/users/register/auto', 'POST', props);
    }

    function purchase(props) {
        return request(w.API_HOST + '/subscriptions/purchase/' + w.PRODUCT_ID, 'POST', props, {
            "Authorization": `Bearer ${w.signUpResponse?.result?.token || ''}`
        });
    }

    function setFormClass(classNames) {
        const form = d.getElementById('form-el');
        if (form) {
            form.classList.add(...classNames.split(' '));
        }
    }

    function removeFormClass(classNames) {
        const form = d.getElementById('form-el');
        if (form) {
            form.classList.remove(...classNames.split(' '));
        }
    }

    function onSignUpFail(e) {
        showError(String(e.message || e.error || e));
        setFormClass('error');
        removeFormClass('in-progress');
        if (typeof w['afterSignUpError'] === 'function') {
            w['afterSignUpError'](e);
        }
    }

    function setClassToTarget(target, classNames) {
        if (target && classNames) {
            target.classList.add(...classNames.split(' '));
        }
    }

    function onPaymentFail(e) {
        showError(String(e.message || e.error || e));
        setFormClass('error');
        removeFormClass('in-progress');
        if (typeof w['afterPaymentError'] === 'function') {
            w['afterPaymentError'](e);
        }
    }

    // MAIN
    let signUpResponse = null;
    w['submitRegistration'] = (eve) => {
        eve.preventDefault();

        const form = eve.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const emailInput = form.elements.emailInput;
        const emailError = document.getElementById('emailError');
        const submitIcon = submitButton.querySelector('.submit-icon');
        const loader = submitButton.querySelector('.loader');

        try {
            setFormClass('in-progress');
            submitButton.disabled = true;
            emailInput.disabled = true;
            submitIcon.style.display = 'none';
            loader.style.display = 'block';
            emailError.textContent = '';
            emailError.style.color = '';

            const email = String(emailInput.value || '').trim();
            if (!email) throw new Error('Email is required');

            const urlParams = new URLSearchParams(window.location.search);
            const paramsObj = Object.fromEntries(urlParams.entries());

            if (!paramsObj.esub && typeof acrum_extra !== 'undefined' && acrum_extra.esub) {
                paramsObj.esab = acrum_extra.esub;
            }

            signup({ email, utm: paramsObj })
                .then((response) => {
                    signUpResponse = response;
                    setFormClass('success');
                    removeFormClass('in-progress');
                    localStorage.setItem('signUpResponse', JSON.stringify(response));

                    // Check if this is post-payment email collection
                    if (document.body.getAttribute('data-step') === 'post-payment') {
                        // Redirect to cherryx.ai after successful email submission
                        setTimeout(() => {
                            try {
                                var params = new URLSearchParams(window.location.search);
                                var regCode = params.get('reg_code') || '';
                                if (regCode) {
                                    params.set('reg_code', regCode);
                                    window.location.href = (window.REDIRECT_HOST || 'https://cherryx.ai') + '/?' + params.toString();
                                } else {
                                    window.location.href = (window.REDIRECT_HOST || 'https://cherryx.ai');
                                }
                            } catch (e) {
                                window.location.href = (window.REDIRECT_HOST || 'https://cherryx.ai');
                            }
                        }, 1500);
                    } else {
                        // Regular funnel navigation
                        window.handleNextNavigation(true);
                    }
                })
                .catch((error) => {
                    submitButton.disabled = false;
                    emailInput.disabled = false;
                    submitIcon.style.display = 'block';
                    loader.style.display = 'none';

                    const errorMessage = error.error ||
                        (error.response?.error)

                    emailError.textContent = errorMessage;
                    emailError.style.color = '#ef4444';
                    w.showError(errorMessage);
                    onSignUpFail(error);
                });
        } catch (e) {
            submitButton.disabled = false;
            emailInput.disabled = false;
            submitIcon.style.display = 'block';
            loader.style.display = 'none';

            emailError.textContent = e.message;
            emailError.style.color = '#ef4444';
            onSignUpFail(e);
        }
    };

    w['initPayment'] = (eve, target) => {
        eve.preventDefault();
        const paymentContainer = d.querySelector('.payment');
        const loader = d.getElementById('loader-spinner');

        if (!w.signUpResponse || !paymentContainer) {
            return;
        }

        if (loader) loader.style.display = 'block';
        paymentContainer.style.display = 'none';

        try {
            purchase({
                method: w.METHOD_ID,
                returnUrl: w.location.href,
            }).then((resp) => {
                const url = resp.result.redirect;
                if (!url) {
                    throw new Error('No payment URL returned');
                }

                const iframe = d.createElement('iframe');
                iframe.src = url;
                iframe.className = 'payment-iframe';
                iframe.setAttribute('allow', 'payment');
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('scrolling', 'no');


                iframe.onload = function() {
                    if (loader) loader.style.display = 'none';
                    paymentContainer.style.display = 'block';
                };

                // Очищаем контейнер и добавляем iframe
                paymentContainer.innerHTML = '';
                paymentContainer.appendChild(iframe);
                paymentContainer.classList.remove('loading');
                paymentContainer.classList.add('active');

                window.addEventListener('message', (event) => {
                    if (event.data.type === 'payment-complete') {
                        console.log('Payment completed:', {paymentCompleteMessage: event});
                        if (typeof w['afterPaymentComplete'] === 'function') {
                            w['afterPaymentComplete']({
                                event,
                                purchaseResponse: resp,
                                signUpResponse: w.signUpResponse
                            });
                        } else {
                            const params = new URLSearchParams(w.location.search);
                            params.set('reg_code', w.signUpResponse.result.code);
                            window.location.href = w.REDIRECT_HOST + '/?' + params.toString();
                        }
                    }
                });

                // Fallback: если провайдер вернул нас в iframe на наш домен, определяем успех и редиректим
                (function setupIframeFallback() {
                    const start = Date.now();
                    const MAX_MS = 120000; // 2 минуты
                    const TICK_MS = 500;
                    const successValues = ['SUCCESS', 'APPROVED', 'PAID', 'COMPLETED', 'OK'];

                    const timer = setInterval(() => {
                        try {
                            if (!iframe.contentWindow) return;
                            // если iframe перешёл на наш домен, доступ к location появится (same-origin)
                            const search = iframe.contentWindow.location.search || '';
                            const params = new URLSearchParams(search);
                            const statusParam = (params.get('status') || params.get('result') || params.get('state') || '').toUpperCase();
                            const successBool = (params.get('success') || '').toLowerCase() === 'true';

                            if (successValues.includes(statusParam) || successBool) {
                                clearInterval(timer);
                                if (typeof w['afterPaymentComplete'] === 'function') {
                                    w['afterPaymentComplete']({
                                        event: { type: 'fallback-detect' },
                                        purchaseResponse: resp,
                                        signUpResponse: w.signUpResponse
                                    });
                                } else {
                                    const topParams = new URLSearchParams(w.location.search);
                                    if (w.signUpResponse && w.signUpResponse.result && w.signUpResponse.result.code) {
                                        topParams.set('reg_code', w.signUpResponse.result.code);
                                    }
                                    setTimeout(() => {
                                        w.location.href = w.REDIRECT_HOST + '/?' + topParams.toString();
                                    }, 450);
                                }
                            }
                        } catch (e) {
                            // cross-origin пока не наш домен — ждём
                        }
                        if (Date.now() - start > MAX_MS) {
                            clearInterval(timer);
                        }
                    }, TICK_MS);
                })();


            }).catch((error) => {
                if (loader) loader.style.display = 'none';
                onPaymentFail(error);
            });
        } catch (e) {
            if (loader) loader.style.display = 'none';
            onPaymentFail(e);
        }
    }
    const urlParams = new URLSearchParams(window.location.search);
    (function () {
        try {
            const statusParam = (urlParams.get('status') || urlParams.get('result') || urlParams.get('state') || '').toUpperCase();
            const successBool = (urlParams.get('success') || '').toLowerCase() === 'true';
            const successValues = ['SUCCESS', 'APPROVED', 'PAID', 'COMPLETED', 'OK'];
            const isSuccess = successValues.includes(statusParam) || successBool;
            if (isSuccess) {
                const id = urlParams.get('id') || urlParams.get('transaction_id') || '';
                console.log({ postMessageURLParams: urlParams });
                // если этот скрипт выполняется внутри iframe — отправим сообщение родителю
                if (w.parent && w.parent !== w) {
                    w.parent.postMessage({ type: 'payment-complete', id: id }, '*');
                }
            }
        } catch (e) {}
    })();
})(document, window);


