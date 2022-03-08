import React from 'react'


export default class ReCaptcha {
     static getRecaptchaToken = async (siteKey, action) => {
        return await window.grecaptcha.execute(siteKey, {action: action})
    }

    static handle = async (data, conf, callback, action) => {
        if (conf.recaptcha_enabled)
        {
            try {
                const captchaToken = await this.getRecaptchaToken(conf.recaptcha_site_key, action)
                return callback({...data, captchaToken})
            } catch(error) {
                return Promise.reject({errorUserMsg: "Error recaptcha", errorMessageKey: "recaptcha.error"})
            }
        }
        else {
            return callback(data)
        }
    }
}

export function importGoogleRecaptchaScript(site_key){
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=" + site_key;
    document.body.appendChild(script);
}

export function extractCaptchaTokenFromData(data) {
    const token = data.captchaToken
    delete data.captchaToken
    return token
}