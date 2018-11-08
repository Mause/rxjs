import { expect } from 'chai';
import { sample, mergeMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { assertDeepEquals } from 'rxjs/internal/test_helpers/assertDeepEquals';

/** @test {sample} */
describe('sample operator', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler(assertDeepEquals);
  });

  //asDiagram('sample')
  it('should get samples when the notifier emits', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('---a----b---c----------d-----|   ');
      const e1subs =   '^                            !   ';
      const e2 =   hot('-----x----------x---x------x---|');
      const e2subs =   '^                            !   ';
      const expected = '-----a----------c----------d-|   ';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should sample nothing if source has not nexted at all', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a-^------------|');
      const e1subs =         '^            !';
      const e2 =   hot(      '-----x-------|');
      const e2subs =         '^            !';
      const expected =       '-------------|';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should behave properly when notified by the same observable as the source (issue #2075)', () => {
    const item$ = new Subject<number>();
    const results: number[] = [];

    item$.pipe(
      sample(item$)
    ).subscribe(value => results.push(value));

    item$.next(1);
    item$.next(2);
    item$.next(3);

    expect(results).to.deep.equal([1, 2, 3]);
  });

  it('should sample nothing if source has nexted after all notifications, but notifier does not complete', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a-^------b-----|');
      const e1subs =         '^            !';
      const e2 =   hot(      '-----x--------');
      const e2subs =         '^            !';
      const expected =       '-------------|';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should sample when the notifier completes', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a-^------b----------|');
      const e1subs =         '^                 !';
      const e2 =   hot(      '-----x-----|');
      const e2subs =         '^          !';
      const expected =       '-----------b------|';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should not complete when the notifier completes, nor should it emit', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a----b----c----d----e----f----');
      const e1subs =   '^                                 ';
      const e2 =   hot('------x-|                         ');
      const e2subs =   '^       !                         ';
      const expected = '------a---------------------------';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should complete only when the source completes, if notifier completes early', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a----b----c----d----e----f---|');
      const e1subs =   '^                                !';
      const e2 =   hot('------x-|                         ');
      const e2subs =   '^       !                         ';
      const expected = '------a--------------------------|';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should allow unsubscribing explicitly and early', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a-^--b----c----d----e----f----|          ');
      const unsub =          '              !                        ';
      const e1subs =         '^             !                        ';
      const e2 =   hot(      '-----x----------x----------x----------|');
      const e2subs =         '^             !                        ';
      const expected =       '-----b---------                        ';

      expectObservable(e1.pipe(sample(e2)), unsub).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should not break unsubscription chains when result is unsubscribed explicitly', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a-^--b----c----d----e----f----|          ');
      const e1subs =         '^             !                        ';
      const e2 =   hot(      '-----x----------x----------x----------|');
      const e2subs =         '^             !                        ';
      const expected =       '-----b---------                        ';
      const unsub =          '              !                        ';

      const result = e1.pipe(
        mergeMap((x: string) => of(x)),
        sample(e2),
        mergeMap((x: string) => of(x))
      );

      expectObservable(result, unsub).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should only sample when a new value arrives, even if it is the same value', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a----b----c----c----e----f----|  ');
      const e1subs =   '^                                 !  ';
      const e2 =   hot('------x-x------xx-x---x----x--------|');
      const e2subs =   '^                                 !  ';
      const expected = '------a--------c------c----e------|  ';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should raise error if source raises error', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a-^--b----c----d----#                    ');
      const e1subs =         '^                 !                    ';
      const e2 =   hot(      '-----x----------x----------x----------|');
      const e2subs =         '^                 !                    ';
      const expected =       '-----b----------d-#                    ';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should completes if source does not emits', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('|');
      const e2 =   hot('------x-------|');
      const expected = '|';
      const e1subs =   '(^!)';
      const e2subs =   '(^!)';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should raise error if source throws immediately', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('#');
      const e2 =   hot('------x-------|');
      const expected = '#';
      const e1subs =   '(^!)';
      const e2subs =   '(^!)';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should raise error if notification raises error', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('--a-----|');
      const e2 =   hot('----#');
      const expected = '----#';
      const e1subs =   '^   !';
      const e2subs =   '^   !';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should not completes if source does not complete', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('-');
      const e1subs =   '^              ';
      const e2 =   hot('------x-------|');
      const e2subs =   '^             !';
      const expected = '-';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should sample only until source completes', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a----b----c----d-|');
      const e1subs =   '^                    !';
      const e2 =   hot('-----------x----------x------------|');
      const e2subs =   '^                    !';
      const expected = '-----------b---------|';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });

  it('should complete sampling if sample observable completes', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptionsTo}) => {
      const e1 =   hot('----a----b----c----d-|');
      const e1subs =   '^                    !';
      const e2 =   hot('|');
      const e2subs =   '(^!)';
      const expected = '---------------------|';

      expectObservable(e1.pipe(sample(e2))).toBe(expected);
      expectSubscriptionsTo(e1).toBe(e1subs);
      expectSubscriptionsTo(e2).toBe(e2subs);
    });
  });
});
