import { lift } from 'rxjs/internal/util/lift';
import { Observable } from 'rxjs/internal/Observable';
import { FOType, OperatorFunction, Sink, SinkArg } from 'rxjs/internal/types';
import { Subscription } from 'rxjs/internal/Subscription';
import { tryUserFunction, resultIsError } from 'rxjs/internal/util/userFunction';

function DEFAULT_COMPARER<T>(a: T, b: T) {
  return a === b;
}

export function distinctUntilChanged<T, K>(
  comparer: ((a: T, b: T) => boolean) = DEFAULT_COMPARER,
  keySelector?: (value: T) => K
): OperatorFunction<T, T> {
  comparer = comparer || DEFAULT_COMPARER;
  return lift((source: Observable<T>, dest: Sink<T>, subs: Subscription)  => {
    let key: K;
    let hasKey = false;
    source(FOType.SUBSCRIBE, (t: FOType, v: SinkArg<T>, subs: Subscription) => {
      let k: any;

      if (t === FOType.NEXT) {
        k = v;
        if (keySelector) {
          k = tryUserFunction(keySelector, v);
          if (resultIsError(k)) {
            dest(FOType.ERROR, k.error, subs);
            subs.unsubscribe();
            return;
          }
        }

        if (hasKey) {
          const match = tryUserFunction(comparer, key, k);
          if (resultIsError(match)) {
            dest(FOType.ERROR, match.error, subs);
            subs.unsubscribe();
            return;
          }

          if (match) {
            return;
          }
        }

        key = k;
        hasKey = true;
      }

      dest(t, v, subs);
    }, subs);
  });
}
