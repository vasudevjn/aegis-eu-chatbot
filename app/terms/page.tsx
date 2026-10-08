import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import {
    AI_NAME,
    OWNER_NAME,
    TERMS_LAST_UPDATED,
    TERMS_CONTACT_EMAIL,
    TERMS_GOVERNING_LAW,
} from "@/config";
import { REFERENCE_REVIEWED_ON } from "@/lib/ai-act/reference";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h3 className="text-xl font-semibold">{title}</h3>
            <div className="space-y-3 text-gray-700">{children}</div>
        </section>
    );
}

function Points({ children }: { children: React.ReactNode }) {
    return <ul className="list-disc list-inside ml-2 space-y-2">{children}</ul>;
}

export default function Terms() {
    const contact = TERMS_CONTACT_EMAIL ? (
        <a href={`mailto:${TERMS_CONTACT_EMAIL}`} className="underline">
            {TERMS_CONTACT_EMAIL}
        </a>
    ) : null;

    return (
        <div className="w-full flex justify-center p-10">
            <div className="w-full max-w-screen-md space-y-8">
                <Link
                    href="/chat"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 underline"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to {AI_NAME}
                </Link>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{AI_NAME}</h1>
                    <h2 className="text-2xl font-semibold">Terms of Use</h2>
                    <p className="text-sm text-gray-600">Last updated: {TERMS_LAST_UPDATED}</p>
                </div>

                <p className="text-gray-700">
                    {AI_NAME} is a free tool operated by {OWNER_NAME} (“we”, “us”). By using it you
                    agree to these terms. If you do not agree, please do not use it. The short
                    version: {AI_NAME} helps you prepare for an EU AI Act review, it is not a
                    lawyer, and you should keep confidential and personal information out of it.
                </p>

                <Section title="1. What Aegis is, and what it is not">
                    <p>
                        {AI_NAME} gives first-line, informational guidance on the EU Artificial
                        Intelligence Act (Regulation (EU) 2024/1689) and related AI governance
                        practice: likely risk classifications, an outline of the obligations that
                        may apply to you, questions to find gaps, action plans and draft documents.
                    </p>
                    <p>
                        It is not affiliated with, endorsed by, or operated by the European
                        Commission, any EU institution or authority, any notified body, or
                        ringel.AI (whose open template it is built on).
                    </p>
                </Section>

                <Section title="2. Not legal advice">
                    <Points>
                        <li>
                            Classifications, obligation maps, gap checks, action plans and drafts are
                            preliminary assessments for internal preparation. They are not legal
                            advice, do not create a lawyer–client relationship, and do not replace
                            review by qualified counsel, notified bodies or competent authorities.
                        </li>
                        <li>
                            A classification is always a “likely” one. Whether a system is
                            prohibited, high-risk or exempt depends on facts and judgement calls that
                            only you and your advisers can fully assess.
                        </li>
                        <li>
                            For high-stakes situations (a possibly prohibited practice, a serious
                            incident, an enquiry from an authority, the imminent launch of a
                            high-risk system), involve qualified counsel promptly.
                        </li>
                        <li>
                            Draft documents (checklists, registers, disclosures and similar) are
                            starting points with placeholders. Do not submit them to a regulator,
                            customer or notified body without review and completion by people who
                            are accountable for them.
                        </li>
                    </Points>
                </Section>

                <Section title="3. Accuracy, currency and AI limitations">
                    <p>
                        {AI_NAME} uses an AI language model, which can make mistakes: it may
                        misread your situation, omit relevant rules, or state something with more
                        confidence than is justified. Check article numbers, dates and thresholds
                        against the official text on EUR-Lex before relying on them.
                    </p>
                    <p>
                        The AI Act is being implemented in phases and has already been amended.
                        {" "}{AI_NAME}’s built-in legal reference was last reviewed on{" "}
                        {REFERENCE_REVIEWED_ON}. Later amendments, guidance and national rules may
                        not be reflected. Where a deadline matters to your plans, confirm it
                        with an official source. Assessments are produced by fixed rules applied
                        to the facts you give, so an incorrect or missing fact can change the
                        result.
                    </p>
                    <p>
                        The AI Act is only part of the picture. Your system may also be subject to
                        data protection law (such as the GDPR), product safety, sector, consumer
                        and employment law, which {AI_NAME} covers only in passing.
                    </p>
                </Section>

                <Section title="4. You are talking to an AI system">
                    <p>
                        Everything {AI_NAME} writes is generated by an AI system, not by a person.
                        If you share its output, for example inside your organisation or with
                        customers, say that it was AI-generated and has been (or has not yet been)
                        reviewed by a human.
                    </p>
                </Section>

                <Section title="5. Who may use it">
                    <p>
                        {AI_NAME} is intended for adults (18 or older) using it for professional
                        purposes, such as product, engineering, legal, compliance and leadership
                        roles. No account is needed.
                    </p>
                </Section>

                <Section title="6. What to enter, and what to keep out">
                    <p>
                        You can describe an AI system in general terms and still get a useful
                        assessment. Please do not enter:
                    </p>
                    <Points>
                        <li>personal data about identifiable people (customers, employees, candidates, patients);</li>
                        <li>trade secrets, source code, unreleased commercial terms or other information you are bound to keep confidential;</li>
                        <li>privileged legal material, or information covered by an NDA or confidentiality clause;</li>
                        <li>passwords, API keys or other credentials.</li>
                    </Points>
                    <p>
                        Generalise or anonymise instead: “an applicant-ranking model used by a
                        retailer in Germany” works as well as the real names.
                    </p>
                </Section>

                <Section title="7. How your data is handled">
                    <Points>
                        <li>
                            <span className="font-semibold">On your device.</span> Your
                            conversations, ratings and conversation summaries are stored in your own
                            browser (local storage). We do not keep a server-side copy of your chat
                            history, and we do not require an account. Clearing your browser data, or
                            deleting a conversation in the sidebar, removes it from your device.
                        </li>
                        <li>
                            <span className="font-semibold">Sent to processors to answer you.</span>{" "}
                            Each message, together with the earlier conversation needed for context,
                            is sent through our hosting platform to the AI provider that runs the
                            language model, which also runs a safety check on your message and
                            produces summaries of long conversations. When needed, search queries
                            based on your question, which may contain details from your description,
                            are sent to a web search provider and, if enabled, to the document
                            library service. The providers in use are set by the operator’s
                            configuration and may include Anthropic, Exa and Pinecone, and, if
                            enabled, OpenAI or Fireworks.
                        </li>
                        <li>
                            <span className="font-semibold">Third-party terms.</span> Those
                            providers process data under their own terms and privacy policies. We
                            do not control how long they retain it, and some may operate outside the
                            European Economic Area. We cannot guarantee confidentiality or security
                            of data in transit or at those providers, which is why section 6
                            matters.
                        </li>
                        <li>
                            <span className="font-semibold">Technical data.</span> Our hosting
                            platform processes technical data such as your IP address when you
                            connect. We use the IP address to limit the number of requests per
                            minute, keeping it only briefly in memory for that purpose.
                        </li>
                        <li>
                            <span className="font-semibold">Ratings.</span> If you rate an answer
                            with a thumbs-up or thumbs-down, the rating is saved in your browser and
                            sent to our server without your identity. We do not currently store it.
                        </li>
                        <li>
                            <span className="font-semibold">What we do not do.</span> We do not
                            build a database of your conversations, sell them, or use them for
                            advertising or to train AI models. If this ever changes, we will update
                            these terms first.
                        </li>
                    </Points>
                    <p>
                        If, despite section 6, you entered personal data, it is used only to
                        generate your answer, by the processors above.
                        {contact ? (
                            <> For privacy questions or requests, including under the GDPR, contact {contact}.</>
                        ) : null}
                    </p>
                </Section>

                <Section title="8. Your content and what Aegis produces">
                    <Points>
                        <li>
                            You keep your rights in what you enter. We do not take ownership of your
                            inputs, and you may use the answers and draft documents {AI_NAME} produces
                            for your own purposes, including internal compliance work.
                        </li>
                        <li>
                            By submitting a message you give us and our processors permission to use
                            it only to provide the service as described in section 7.
                        </li>
                        <li>
                            AI output may resemble output given to other users. We make no claim
                            that it is unique or free from third-party rights.
                        </li>
                    </Points>
                </Section>

                <Section title="9. Acceptable use">
                    <p>You agree not to use {AI_NAME} to:</p>
                    <Points>
                        <li>conceal non-compliance, mislead regulators, notified bodies or affected persons, or falsify documentation;</li>
                        <li>design, build or tune a system for a practice the AI Act prohibits;</li>
                        <li>break the law, or send harassing, hateful, sexually explicit or otherwise harmful content;</li>
                        <li>probe, overload or attack the service, bypass its rate limits or safety measures, or try to extract its instructions;</li>
                        <li>copy or resell the service, or scrape it with automated tools.</li>
                    </Points>
                    <p>
                        {AI_NAME} will decline requests of these kinds, and we may limit or block
                        access if they continue.
                    </p>
                </Section>

                <Section title="10. Availability and changes">
                    <p>
                        {AI_NAME} is provided free of charge and “as available”. We may change,
                        suspend or discontinue it, or introduce fees for it, at any time. If we
                        introduce fees, they will not apply to use before the change.
                    </p>
                </Section>

                <Section title="11. Liability">
                    <p>
                        To the fullest extent permitted by law, {AI_NAME} is provided “as is”,
                        without warranties of accuracy, completeness, fitness for a particular
                        purpose or non-infringement. {OWNER_NAME} is not liable for losses arising
                        from your use of or reliance on {AI_NAME}, including regulatory fines,
                        lost business, or decisions taken on the basis of its output.
                    </p>
                    <p>
                        Nothing in these terms excludes or limits liability that cannot be
                        excluded or limited by law (for example for fraud, or for death or
                        personal injury caused by negligence), or any mandatory rights you have as
                        a consumer or data subject.
                    </p>
                </Section>

                {TERMS_GOVERNING_LAW ? (
                    <Section title="12. Governing law">
                        <p>
                            These terms are governed by {TERMS_GOVERNING_LAW}, without prejudice to
                            any mandatory rights you have under the law of the country where you
                            live.
                        </p>
                    </Section>
                ) : null}

                <Section title={`${TERMS_GOVERNING_LAW ? "13" : "12"}. Changes to these terms`}>
                    <p>
                        We may update these terms from time to time. The date at the top shows
                        when they last changed; continuing to use {AI_NAME} after a change means
                        you accept the updated terms.
                        {contact ? <> Questions about these terms can be sent to {contact}.</> : null}
                    </p>
                </Section>
            </div>
        </div>
    );
}
