import { ID, Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class QuizInput extends via((field) => ({
  userId: field(ID, { ref: "user", immutable: true }),
})) {
  static minSize = 4; // @ok
}

export class QuizObject extends via(QuizInput, (field) => ({
  correctNum: field(Int, { default: 0, min: 0 }),
})) {}

export class LightQuiz extends via(QuizObject, ["userId", "correctNum"] as const, (resolve) => ({})) {
  isPerfect() { // @ok
    return this.correctNum === 4;
  }
  staticNum = 1; // @ok
}

export class Quiz extends via(QuizObject, LightQuiz, (resolve) => ({})) {
  static choiceNum = 4; // @ok
  static xpOfCorrect(comboNum: number) { // @ok
    return comboNum * 10;
  }
}

export class QuizInsight extends via(Quiz, (field) => ({})) {
  static emptyNum = 0; // @ok
}

export class Coordinate extends via((field) => ({
  lat: field(Int),
})) {
  static getDistanceKm(a: Coordinate, b: Coordinate) { // @ok
    return a.lat - b.lat;
  }
}

export class ObjectRegistry {
  static instance = new ObjectRegistry(); // @ok
}
