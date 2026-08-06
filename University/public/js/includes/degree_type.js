$(document).ready(function () {
    $('#degree_id').change(function() {
        var degree_id = $(this).val();

        if (degree_id) {
            $.ajax({
                url: '/get-disciplines',
                type: 'GET',
                data: { degree_id: degree_id },
                success: function(response) {
                    console.log(response);
                    $('#discipline_id').empty().append('<option value="" disabled selected>Select Discipline</option>');
                    $.each(response, function(key, discipline) {
                        $('#discipline_id').append('<option value="'+discipline.id+'">'+discipline.name+'</option>');
                    });
                }
            });
        } else {
            $('#discipline_id').empty().append('<option value="" disabled selected>Select Discipline</option>');
        }
    });

    $("#add-degree_type-btn").on("click", function (e) {

        e.preventDefault();
        let form = document.getElementById("degree_type");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/degree_type",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirect_url;
                    form.reset();
                } else {
                    toastr.error("Failed to create degree type post.");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 422) {
                    let errors = jqXHR.responseJSON.errors;
                    for (let field in errors) {
                        toastr.error(errors[field][0]);
                    }
                } else {
                    toastr.error("An error occurred. Please try again.");
                }
            },
        });
        console.log(test)
    });

    $(document).on("click", "#edit-degree_type", function (e) {
        e.preventDefault();

        var degreeTypeId = $(this).data("id");
        window.location.href = "/masters/degree_type/" + degreeTypeId + "/edit";
    });

    $(document).on("click", "#update-degree_type", function (e) {
        e.preventDefault();
        var degreeTypeId = $(this).data("update-id");
        let form = document.getElementById("degree_type");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/degree_type/" + degreeTypeId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                formData.append("_method", "PUT");
            },
        })
            .done(function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirectUrl;
                } else {
                    toastr.error(response.message);
                }
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error(
                    "Failed to update the degree type. Please try again."
                );
            });
    });

    $(document).on("click", "#delete-degree_type", function (e) {
        e.preventDefault();
        var degreeTypeId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this degree type test?")) {
            return;
        }

        $.ajax({
            url: "/masters/degree_type/" + degreeTypeId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirectUrl;
                } else {
                    toastr.error(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error(
                    "Failed to delete the degree type. Please try again."
                );
            },
        });
    });
});
