// MongoDB initialization script
print("Starting MongoDB initialization...");

// Switch to the realtime-docs database
db = db.getSiblingDB("realtime-docs");

// Create collections with validation
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["email", "name", "password"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    description: "must be a valid email address",
                },
                name: {
                    bsonType: "string",
                    minLength: 1,
                    description: "must be a string and is required",
                },
                password: {
                    bsonType: "string",
                    minLength: 6,
                    description: "must be a string and is required",
                },
                avatar: {
                    bsonType: "string",
                    description: "must be a string if the field exists",
                },
            },
        },
    },
});

db.createCollection("documents", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["title", "ownerId"],
            properties: {
                title: {
                    bsonType: "string",
                    minLength: 1,
                    description: "must be a string and is required",
                },
                content: {
                    bsonType: "string",
                    description: "must be a string",
                },
                ownerId: {
                    bsonType: "objectId",
                    description: "must be an ObjectId and is required",
                },
                collaborators: {
                    bsonType: "array",
                    items: {
                        bsonType: "objectId",
                    },
                    description: "must be an array of ObjectIds",
                },
                isPublic: {
                    bsonType: "bool",
                    description: "must be a boolean",
                },
            },
        },
    },
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.documents.createIndex({ ownerId: 1 });
db.documents.createIndex({ collaborators: 1 });
db.documents.createIndex({ isPublic: 1 });
db.documents.createIndex({ updatedAt: -1 });
db.documents.createIndex({ title: "text", content: "text" });

print("MongoDB initialization completed successfully!");
print("Created collections: users, documents");
print("Created indexes for optimized queries");
