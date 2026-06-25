import { AppError } from '../errors/AppError';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error | AppError;
  timestamp: string;
}

class Logger {
  private formatMessage(log: LogMessage): string {
    const { level, message, context, error, timestamp } = log;
    
    // In production, you might want to return a JSON string
    // return JSON.stringify(log);

    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context) {
      formattedMessage += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error) {
      formattedMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        formattedMessage += `\n${error.stack}`;
      }
    }

    return formattedMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const logMessage: LogMessage = {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString(),
    };

    const formattedMessage = this.formatMessage(logMessage);

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();
