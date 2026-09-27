/** Which of a slice's in-flight list requests is current, so a slower, older response is dropped. */
export class SliceRequest {
  #latest = 0;

  claim(): number {
    this.#latest += 1;
    return this.#latest;
  }

  isCurrent(ticket: number): boolean {
    return ticket === this.#latest;
  }
}
