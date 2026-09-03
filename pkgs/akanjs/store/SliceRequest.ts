/**
 * Which list request for one slice is the current one.
 *
 * Every paging action reads state, fires a fetch, and writes the answer back. Two of them in flight — a user
 * clicking page 2 then page 3 — race, and the *slower* response used to win: the list from one page landed under
 * the page number of another, and the spinner was cleared by whichever finished last. Nothing in the state could
 * say which request a response belonged to, so a ticket says it instead.
 *
 * One per slice rather than per action, because every one of them writes the same `<model>List`.
 */
export class SliceRequest {
  #latest = 0;

  /** Takes the next ticket and makes it the current one, so every earlier request is now stale. */
  claim(): number {
    this.#latest += 1;
    return this.#latest;
  }

  isCurrent(ticket: number): boolean {
    return ticket === this.#latest;
  }
}
