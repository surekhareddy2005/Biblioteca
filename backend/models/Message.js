const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        reportedByRole: {
            type: String,
            enum: ["STUDENT", "ADMIN", "SUPER_ADMIN"],
            required: true,
        },
        reportedByName: {
            type: String,
            trim: true,
            default: "Unknown",
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
    },
    {
        timestamps: true,
    }
);

const messageSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },

        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        authorRole: {
            type: String,
            enum: ["STUDENT", "ADMIN", "SUPER_ADMIN"],
            required: true,
        },

        authorName: {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        reports: {
            type: [reportSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.virtual("reportCount").get(function () {
    return this.reports ? this.reports.length : 0;
});

messageSchema.set("toObject", { virtuals: true });
messageSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Message", messageSchema);