import winston, { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

import 'winston-daily-rotate-file';

var transport = new winston.transports.DailyRotateFile({
    level: 'debug',
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '14d',
    dirname: './.log',
});

const customFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
    transports: [
        transport,
        new winston.transports.Console({
            // format: winston.format.simple(),
            format: combine(
                label({ label: 'App Name' }),
                timestamp(),
                customFormat
              ),
            level: 'debug',
        })
    ]
});

export default logger;