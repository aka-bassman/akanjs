import type { ConstantModel, ScalarConstantModel } from "akanjs/constant";
import type { DatabaseCls, DatabaseModel } from "akanjs/document";
import type { ServiceModel } from "akanjs/service";
import type { DatabaseSignal, ServiceSignal } from "akanjs/signal";
import type { AkanOption } from "./akanOption";

export interface DatabaseModule {
  constant: ConstantModel;
  database: DatabaseModel;
  service: ServiceModel;
  signal: DatabaseSignal;
}

export interface ServiceModule {
  service: ServiceModel;
  signal: ServiceSignal;
}

export interface ScalarModule {
  constant: ScalarConstantModel;
  database: DatabaseCls;
}

export interface AkanLibProps {
  databases: DatabaseModule[];
  services: ServiceModule[];
  scalars: ScalarModule[];
  option: AkanOption<any>;
}
export class AkanLib {
  readonly name: string;
  readonly database: DatabaseModule[];
  readonly service: ServiceModule[];
  readonly scalar: ScalarModule[];
  readonly option: AkanOption<any>;
  constructor(name: string, props: AkanLibProps) {
    this.name = name;
    this.database = props.databases;
    this.service = props.services;
    this.scalar = props.scalars;
    this.option = props.option;
  }
}
