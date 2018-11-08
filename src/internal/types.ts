import { Subscription } from 'rxjs/internal/Subscription';
import { Observable } from 'rxjs/internal/Observable';

export const enum FOType {
  SUBSCRIBE = 0,
  NEXT = 1,
  COMPLETE = 2,
  ERROR = 3,
  DISPOSE = 4,
}

export type SinkArg<T> = T | void | any;

export interface DisposableFObs {
  (type: FOType.DISPOSE, arg: void, subs: Subscription): void;
}

export interface Sink<T> {
  (type: FOType.NEXT, value: T, subs: Subscription): void;
  (type: FOType.ERROR, err: any, subs: Subscription): void;
  (type: FOType.COMPLETE, arg: void, subs: Subscription): void;
  (type: FOType, arg: FObsArg<T>, subs: Subscription): void;
}

export interface Source<T> {
  (type: FOType.SUBSCRIBE, sink: Sink<T>, subs: Subscription): void;
}

export interface FObs<T> extends Source<T>, Sink<T> {
  (type: FOType, arg: FObsArg<T>, subs: Subscription): void;
}

export type FObsArg<T> = SinkArg<T> | void;

export type TeardownLogic = Unsubscribable | (() => void) | void;

export interface NextObserver<T> {
  next: (value: T, subscription: Subscription) => void;
  error?: (err: any) => void;
  complete?: () => void;
  [key: string]: any;
}

export interface ErrorObserver<T> {
  next?: (value: T, subscription: Subscription) => void;
  error: (err: any) => void;
  complete?: () => void;
  [key: string]: any;
}

export interface CompleteObserver<T> {
  next?: (value: T, subscription: Subscription) => void;
  error?: (err: any) => void;
  complete: () => void;
  [key: string]: any;
}

export type PartialObserver<T> = NextObserver<T> | ErrorObserver<T> | CompleteObserver<T>;

export interface Observer<T> {
  next: (value: T, subscription?: Subscription) => void;
  error: (err: any) => void;
  complete: () => void;
  [key: string]: any;
}

export interface SchedulerLike {
  now(): number;
  schedule<T>(work: () => void): Subscription;
  schedule<T>(work: () => void, delay: number): Subscription;
  schedule<T>(work: (state?: T) => void, delay: number, state: T): Subscription;
  schedule<T>(work: (state?: T) => void, delay: number, state: T, subs: Subscription): Subscription;
}

export type OperatorFunction<T, R> = (source: Observable<T>) => Observable<R>;

export interface ObservableLike<T> {
  subscribe(observer: Observer<T>): Unsubscribable;
}

export interface InteropObservable<T> {
  [Symbol.observable](): ObservableLike<T>;
}

export type ObservableInput<T> = Observable<T> | ObservableLike<T> | PromiseLike<T> |
  Array<T> | ArrayLike<T> | InteropObservable<T> | AsyncIterable<T> | Iterable<T>;

export interface Unsubscribable {
  unsubscribe(): void;
}

export interface SubscriptionLike extends Unsubscribable {
  unsubscribe(): void;
  closed: boolean;
}

export interface GroupedObservable<K, T> extends Observable<T> {
  readonly key: K;
}

export interface NotificationLike<T> {
  kind: 'N'|'E'|'C';
  value?: T;
  error?: any;
}

export interface Timestamped<T> {
  value: T;
  timestamp: number;
}

declare global  {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export type MonoTypeOperatorFunction<T> = OperatorFunction<T, T>;
