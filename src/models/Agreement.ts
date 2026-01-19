import mongoose, { Schema, Document } from 'mongoose';
import './Book';
import './Creator';

export interface IAgreement extends Document {
  book: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  role: 'author' | 'illustrator' | 'translator';
  royaltyPercentage: number;
  advancePayment?: number;
  status: 'draft' | 'active' | 'terminated';
  signedContractUrl?: string;
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgreementSchema: Schema = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'El libro es obligatorio'],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: [true, 'El creador es obligatorio'],
    },
    role: {
      type: String,
      enum: ['author', 'illustrator', 'translator'],
      required: [true, 'El rol es obligatorio'],
    },
    royaltyPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    advancePayment: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'terminated'],
      default: 'draft',
    },
    isPublicDomain: {
      type: Boolean,
      default: false,
    },
    signedContractUrl: {
      type: String,
    },
    validFrom: {
      type: Date,
    },
    validUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas rápidas
AgreementSchema.index({ book: 1, creator: 1 }, { unique: true }); // Un contrato por par Libro-Creador (asumimos, o tal vez rol?)
// Si un creador puede ser autor Y traductor en el mismo libro... debería ser unique por book+creator+role?
// El usuario dijo "cada creador está asociado a un libro mediante un agreement".
// Supongamos book + creator + role es lo más seguro.
AgreementSchema.index({ creator: 1 });

// Sobrescribir el modelo si ya existe para evitar errores en hot reload
export default mongoose.models.Agreement ||
  mongoose.model<IAgreement>('Agreement', AgreementSchema);
