const cron = require("node-cron");

const Issue = require("../models/Issue");
const sendEmail = require("./sendEmail");
const { getOrCreateSettings } = require("../controllers/settingsController");

// Runs once a day. Deliberately does NOT hardcode "day 14" or any fixed
// day count - it just looks at each issue's actual (holiday-aware) due
// date and asks "is that tomorrow?". That way it stays correct no matter
// what the Super Admin sets the return period to in Library Settings.
cron.schedule("0 9 * * *", async () => {

    console.log("Checking for books due tomorrow...");

    try {

        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const dueTomorrow = await Issue.find({
            status: "ISSUED",
            reminderSent: false,
            dueDate: {
                $gte: tomorrowStart,
                $lte: tomorrowEnd,
            },
        })
            .populate("student", "name email")
            .populate("book", "title");

        if (dueTomorrow.length === 0) {
            console.log("No books due tomorrow. Nothing to remind.");
            return;
        }

        const settings = await getOrCreateSettings();

        for (const issue of dueTomorrow) {

            if (!issue.student?.email) {
                continue;
            }

            const formattedDue = issue.dueDate.toLocaleDateString("en-IN", {
                dateStyle: "medium",
            });

            await sendEmail(
                issue.student.email,
                "Reminder: Your Book Is Due Tomorrow",
                `Hello ${issue.student.name},

This is a reminder that your borrowed book "${issue.book.title}" is due on ${formattedDue}.

Please return it on time to avoid an overdue fine of ₹${settings.finePerDay} per day.

Thank you,
Library Team`
            );

            issue.reminderSent = true;
            await issue.save();

            console.log(`Due-tomorrow reminder sent to ${issue.student.email} for "${issue.book.title}"`);
        }

    } catch (error) {

        console.log(error.message);

    }

});