/**********************************************************************************
 * MIT License                                                                    *
 *                                                                                *
 * Copyright (c) 2021 Hyperjump Technology                                        *
 *                                                                                *
 * Permission is hereby granted, free of charge, to any person obtaining a copy   *
 * of this software and associated documentation files (the "Software"), to deal  *
 * in the Software without restriction, including without limitation the rights   *
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell      *
 * copies of the Software, and to permit persons to whom the Software is          *
 * furnished to do so, subject to the following conditions:                       *
 *                                                                                *
 * The above copyright notice and this permission notice shall be included in all *
 * copies or substantial portions of the Software.                                *
 *                                                                                *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR     *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,       *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE    *
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER         *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  *
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  *
 * SOFTWARE.                                                                      *
 **********************************************************************************/

import { Probe } from '../../interfaces/probe'
import { AxiosResponseWithExtraData } from '../../interfaces/request'

type CheckResponseFn = (response: AxiosResponseWithExtraData) => boolean
export type ValidateResponseStatus = { alert: string; status: boolean }

// Check if response status is not 2xx
export const statusNot2xx: CheckResponseFn = (response) =>
  response.status < 200 || response.status >= 300

// Check if response time is greater than specified value in milliseconds
export const responseTimeGreaterThan: (
  minimumTime: number
) => CheckResponseFn = (minimumTime) => (
  response: AxiosResponseWithExtraData
): boolean => {
  const respTimeNum = response.config.extraData?.responseTime ?? 0

  return respTimeNum > minimumTime
}

// parse string like "response-time-greater-than-200-ms" and return the time in ms
export const parseAlertStringTime = (str: string): number => {
  // match any string that ends with digits followed by unit 's' or 'ms'
  const match = str.match(/(\d+)-(m?s)$/)
  if (!match) {
    throw new Error('alert string does not contain valid time number')
  }

  const number = Number(match[1])
  const unit = match[2]

  if (unit === 's') return number * 1000
  return number
}

export const getCheckResponseFn = (
  alert: string
): CheckResponseFn | undefined => {
  if (alert === 'status-not-2xx') {
    return statusNot2xx
  }
  if (alert.startsWith('response-time-greater-than-')) {
    const alertTime = parseAlertStringTime(alert)
    return responseTimeGreaterThan(alertTime)
  }
}

export const validateResponse = (
  alerts: Probe['alerts'],
  response: AxiosResponseWithExtraData
): ValidateResponseStatus[] => {
  const checks = []

  for (const alert of alerts) {
    const checkFn = getCheckResponseFn(alert.toLowerCase())
    if (checkFn) {
      checks.push({
        alert,
        status: checkFn(response),
      })
    }
  }

  return checks
}
