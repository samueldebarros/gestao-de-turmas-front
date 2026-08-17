import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environments';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.url.startsWith(environment.apiUrl) ? req.clone({ withCredentials: true }) : req);
