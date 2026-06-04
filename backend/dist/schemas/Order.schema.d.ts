import mongoose, { Document, Types } from 'mongoose';
export type OrderDocument = Order & Document;
export declare class Order {
    pickupAddress: string;
    dropAddress: string;
    packageDetails: string;
    priority: string;
    status: string;
    clientId: mongoose.Types.ObjectId;
    riderId?: mongoose.Types.ObjectId;
    proofPhoto?: string;
    timeTaken?: number;
    assignedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    zone?: string;
    failureReason?: string;
    handoverNote?: string;
}
export declare const OrderSchema: mongoose.Schema<Order, mongoose.Model<Order, any, any, any, any, any, Order>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Order, mongoose.Document<unknown, {}, Order, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    pickupAddress?: mongoose.SchemaDefinitionProperty<string, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    dropAddress?: mongoose.SchemaDefinitionProperty<string, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    packageDetails?: mongoose.SchemaDefinitionProperty<string, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    priority?: mongoose.SchemaDefinitionProperty<string, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: mongoose.SchemaDefinitionProperty<string, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    clientId?: mongoose.SchemaDefinitionProperty<Types.ObjectId, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    riderId?: mongoose.SchemaDefinitionProperty<Types.ObjectId | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    proofPhoto?: mongoose.SchemaDefinitionProperty<string | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    timeTaken?: mongoose.SchemaDefinitionProperty<number | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    assignedAt?: mongoose.SchemaDefinitionProperty<Date | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pickedUpAt?: mongoose.SchemaDefinitionProperty<Date | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveredAt?: mongoose.SchemaDefinitionProperty<Date | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    zone?: mongoose.SchemaDefinitionProperty<string | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failureReason?: mongoose.SchemaDefinitionProperty<string | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    handoverNote?: mongoose.SchemaDefinitionProperty<string | undefined, Order, mongoose.Document<unknown, {}, Order, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Order>;
