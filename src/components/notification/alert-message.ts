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

import { parseAlertStringTime } from './alert'

export function getMessageForAlert({
  alert,
  url,
  ipAddress,
  status,
  incidentThreshold,
}: {
  alert: string
  url: string
  ipAddress: string
  status: string
  incidentThreshold: number
}): {
  subject: string
  body: string
} {
  const getSubject = (url: string, status: string) => {
    const statusAlert = `Target ${url} is not OK`
    if (alert === 'status-not-2xx' && status === 'UP')
      return `[RECOVERY] ${statusAlert}`
    if (alert === 'status-not-2xx' && status === 'DOWN')
      return `[INCIDENT] ${statusAlert}`

    const responseAlert = `Target ${url} took too long to respond`
    if (alert.includes('response-time-greater-than-') && status === 'UP')
      return `[RECOVERY] ${responseAlert}`

    return `[INCIDENT] ${responseAlert}`
  }

  const getBody = (status: string) => {
    if (alert === 'status-not-2xx' && status === 'DOWN')
      return `Target ${url} is not healthy. It has not been returning status code 2xx ${incidentThreshold} times in a row.`

    if (alert.includes('response-time-greater-than-') && status === 'DOWN') {
      const alertTime = parseAlertStringTime(alert)
      return `Target ${url} is not healthy. The response time has been greater than ${alertTime} ${incidentThreshold} times in a row`
    }

    return `Target ${url} is back to healthy.`
  }

  const today = new Date().toUTCString()
  const message = {
    subject: getSubject(url, status),
    body: `
      ${getBody(status)}\n\n
      Time: ${today}\n
      Target URL: ${url}\n
      From server: ${ipAddress}
    `,
  }

  return message
}
